import puppeteer, { Page, Browser } from "puppeteer";
import fs from "fs";
import path from "path";

interface BattleData {
  id: number;
  name: string;
  date: string;
  region: string;
  country: string;
  description: string;
  result: string;
  belligerents: string;
  commanders: string;
  casualties: string;
  image: string;
}

const WAR_URLS: { url: string; region: string; country: string }[] = [
  {
    url: "https://es.wikipedia.org/wiki/Guerra_de_%C3%81frica",
    region: "Norte de África",
    country: "Marruecos",
  },
  {
    url: "https://es.wikipedia.org/wiki/Batalla_de_Lepanto",
    region: "Mediterráneo",
    country: "Grecia",
  },
  {
    url: "https://es.wikipedia.org/wiki/Batalla_de_Trafalgar",
    region: "Atlántico",
    country: "España",
  },
  {
    url: "https://es.wikipedia.org/wiki/Batalla_de_las_Navas_de_Tolosa",
    region: "Península Ibérica",
    country: "España",
  },
  {
    url: "https://es.wikipedia.org/wiki/Batalla_del_Ebro",
    region: "Península Ibérica",
    country: "España",
  },
  {
    url: "https://es.wikipedia.org/wiki/Batalla_de_Bail%C3%A9n",
    region: "Península Ibérica",
    country: "España",
  },
  {
    url: "https://es.wikipedia.org/wiki/Batalla_de_Stalingrado",
    region: "Europa del Este",
    country: "Rusia",
  },
  {
    url: "https://es.wikipedia.org/wiki/Batalla_de_Normandía",
    region: "Europa Occidental",
    country: "Francia",
  },
  {
    url: "https://es.wikipedia.org/wiki/Batalla_de_Termopilas",
    region: "Mediterráneo",
    country: "Grecia",
  },
];

// Este string se ejecuta TAL CUAL en el navegador de Puppeteer.
// tsx no lo transforma porque es un string literal.
const EVALUATE_SCRIPT = `
(function() {
  function clean(text) {
    return text
      .replace(/\\[\\d+\\]/g, "")   // quitar referencias [1], [2]...
      .replace(/\\u200b/g, "")      // zero-width space
      .replace(/\\u00a0/g, " ")     // &nbsp;
      .replace(/\\s+/g, " ")
      .trim();
  }

  // Extrae las líneas de un <td> usando los <br> como separadores reales
  function extractLines(td) {
    // Reemplazar cada <br> con un marcador antes de usar textContent
    var clone = td.cloneNode(true);
    clone.querySelectorAll("br").forEach(function(br) {
      br.replaceWith("||BR||");
    });
    var raw = clone.textContent || "";
    return raw
      .split("||BR||")
      .map(function(l) { return clean(l); })
      .filter(function(l) { return l.length > 1; });
  }

  // ── Título ──
  var titleEl = document.querySelector("#firstHeading");
  var title = titleEl ? titleEl.textContent.trim() : "";

  // ── Descripción ──
  var firstP = document.querySelector(
    "#mw-content-text .mw-parser-output > p:not(.mw-empty-elt)"
  );
  var description = firstP ? clean(firstP.textContent || "") : "";

  // ── Infobox ──
  var infobox = document.querySelector(".infobox");
  var infoData = {};
  var sections = { beligerantes: null, comandantes: null, bajas: null };

  if (infobox) {
    var rows = infobox.querySelectorAll(":scope > tbody > tr");
    var currentSection = "";

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];

      // ── Cabecera de sección: <th colspan> sin tabla interna ──
      var th = row.querySelector(":scope > th");
      var directTds = row.querySelectorAll(":scope > td");

      if (th && directTds.length === 0) {
        var hText = clean(th.textContent || "").toLowerCase();
        if (hText.includes("beligerante") || hText.includes("parte")) {
          currentSection = "beligerantes";
        } else if (hText.includes("comandante") || hText.includes("mando") || hText.includes("figura")) {
          currentSection = "comandantes";
        } else if (hText.includes("baja") || hText.includes("pérdida") || hText.includes("perdida") || hText.includes("fuerza")) {
          currentSection = "bajas";
        } else if (
          hText.includes("resultado") || hText.includes("fecha") ||
          hText.includes("lugar") || hText.includes("conflicto") ||
          hText.includes("consecuencia")
        ) {
          currentSection = "";
        }
        continue;
      }

      // ── Fila de metadatos clave-valor: th + 1 td directo ──
      if (th && directTds.length === 1) {
        var key = clean(th.textContent || "").toLowerCase();
        var val = clean(directTds[0].textContent || "");
        infoData[key] = val;
        continue;
      }

      // ── Fila de sección con tabla anidada plainlist ──
      // Estructura: <tr><td colspan="3"><table class="plainlist"><tbody><tr><td>…</td><td>…</td></tr></tbody></table></td></tr>
      if (currentSection && directTds.length === 1) {
        var innerTable = directTds[0].querySelector("table.plainlist");
        if (innerTable) {
          var innerRows = innerTable.querySelectorAll("tbody > tr");
          var band1 = [];
          var band2 = [];
          innerRows.forEach(function(iRow) {
            var cells = iRow.querySelectorAll(":scope > td");
            if (cells.length >= 2) {
              extractLines(cells[0]).forEach(function(l) { band1.push(l); });
              extractLines(cells[1]).forEach(function(l) { band2.push(l); });
            } else if (cells.length === 1) {
              extractLines(cells[0]).forEach(function(l) { band1.push(l); });
            }
          });
          if (!sections[currentSection]) {
            sections[currentSection] = { band1: [], band2: [] };
          }
          sections[currentSection].band1.push(...band1);
          sections[currentSection].band2.push(...band2);
          continue;
        }

        // ── Fila con un solo td sin plainlist (ej: "Unos 8000-10000 muertos en total") ──
        var singleLines = extractLines(directTds[0]);
        var useful = singleLines.filter(function(l) {
          return !l.toLowerCase().includes("editar datos");
        });
        if (useful.length > 0) {
          if (!sections[currentSection]) {
            sections[currentSection] = { band1: [], band2: [] };
          }
          // Añadir al band1 como nota general
          sections[currentSection].band1.push(...useful);
        }
      }
    }
  }

  // ── Serializar: "línea1\\nlinea2 | línea1\\nlinea2" ──
  function serialize(sec) {
    if (!sec) return "Desconocido";
    var b1 = [...new Set(sec.band1)].join("\\n");
    var b2 = [...new Set(sec.band2)].join("\\n");
    if (b2) return b1 + " | " + b2;
    return b1 || "Desconocido";
  }

  // ── Imagen ──
  var image = "";
  var infoboxImg = infobox ? infobox.querySelector("img") : null;
  if (infoboxImg) {
    image = infoboxImg.getAttribute("src") || "";
  } else {
    var articleImg = document.querySelector("#mw-content-text .mw-parser-output img");
    if (articleImg) image = articleImg.getAttribute("src") || "";
  }
  if (image && !image.startsWith("http")) image = "https:" + image;

  return {
    title:        title,
    description:  description,
    infoData:     infoData,
    belligerents: serialize(sections.beligerantes),
    commanders:   serialize(sections.comandantes),
    casualties:   serialize(sections.bajas),
    image:        image
  };
})()
`;

async function downloadImageWithBrowser(
  browser: Browser,
  imageUrl: string,
  filepath: string,
): Promise<boolean> {
  const imgPage = await browser.newPage();
  try {
    const response = await imgPage.goto(imageUrl, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    if (!response || !response.ok()) {
      console.error(`HTTP ${response?.status()} para ${imageUrl}`);
      return false;
    }

    const buffer = await response.buffer();

    if (buffer.length < 500) {
      console.error(`Imagen demasiado pequeña (${buffer.length} bytes): ${imageUrl}`);
      return false;
    }

    fs.writeFileSync(filepath, buffer);
    return true;
  } catch (e) {
    console.error(`Error descargando ${imageUrl}:`, e);
    return false;
  } finally {
    await imgPage.close();
  }
}

async function scrapeBattle(
  page: Page,
  entry: { url: string; region: string; country: string },
  id: number,
): Promise<BattleData | null> {
  try {
    await page.goto(entry.url, { waitUntil: "networkidle2", timeout: 15000 });

    const data = (await page.evaluate(EVALUATE_SCRIPT)) as {
      title: string;
      description: string;
      infoData: Record<string, string>;
      belligerents: string;
      commanders: string;
      casualties: string;
      image: string;
    };

    if (!data) return null;

    const findValue = (...keys: string[]): string => {
      for (const key of keys) {
        for (const [k, v] of Object.entries(data.infoData)) {
          if (k.includes(key)) return v;
        }
      }
      return "Desconocido";
    };

    return {
      id,
      name: data.title,
      date: findValue("fecha", "date"),
      region: entry.region,
      country: entry.country,
      description:
        data.description.length > 1000
          ? data.description.substring(0, 1000) + "..."
          : data.description,
      result: findValue("resultado", "result"),
      belligerents: data.belligerents || "Desconocido",
      commanders: data.commanders || "Desconocido",
      casualties: data.casualties || "Desconocido",
      image: data.image || "",
    };
  } catch (error) {
    console.error(`Error scraping ${entry.url}:`, error);
    return null;
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const battles: BattleData[] = [];
  let id = 0;

  for (const entry of WAR_URLS) {
    console.log(`Scraping: ${entry.url}`);
    const battle = await scrapeBattle(page, entry, id);
    if (battle) {
      battles.push(battle);
      id++;
    }
  }

  // Descargar imágenes
  const imgDir = "./public/images";
  if (!fs.existsSync("./public")) fs.mkdirSync("./public");
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

  for (const battle of battles) {
    if (battle.image && battle.image.startsWith("http")) {
      let fullUrl = battle.image;
      if (fullUrl.includes("/thumb/")) {
        fullUrl = fullUrl.replace("/thumb/", "/").replace(/\/\d+px-[^/]+$/, "");
      }

      const filename = `battle_${battle.id}.jpg`;
      const filepath = path.join(imgDir, filename);

      console.log(`Descargando imagen ${battle.id}: ${fullUrl}`);
      const success = await downloadImageWithBrowser(browser, fullUrl, filepath);

      if (success) {
        battle.image = `http://localhost:3000/images/${filename}`;
        console.log(`✅ Descargada: ${filename} (${fs.statSync(filepath).size} bytes)`);
      } else {
        console.log(`Reintentando con thumbnail...`);
        const success2 = await downloadImageWithBrowser(browser, battle.image, filepath);
        if (success2) {
          battle.image = `http://localhost:3000/images/${filename}`;
          console.log(`✅ Descargada (thumbnail): ${filename} (${fs.statSync(filepath).size} bytes)`);
        } else {
          battle.image = "";
          console.error(`❌ No se pudo descargar imagen de ${battle.name}`);
        }
      }
    }
  }

  fs.writeFileSync("db.json", JSON.stringify({ battles }, null, 2), "utf-8");
  console.log(`\n✅ ${battles.length} batallas scrapeadas y guardadas en db.json`);
  await browser.close();
})();
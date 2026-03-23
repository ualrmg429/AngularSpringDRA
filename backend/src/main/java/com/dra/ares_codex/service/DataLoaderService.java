package com.dra.ares_codex.service;

import com.dra.ares_codex.entity.Battle;
import com.dra.ares_codex.repository.BattleRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Service
public class DataLoaderService implements CommandLineRunner {

    @Autowired
    private BattleRepository battleRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${data.file.path:/data/db.json}")
    private String dataFilePath;

    @Override
    public void run(String... args) throws Exception {
        if (battleRepository.count() > 0) {
            System.out.println("Data already loaded, skipping.");
            return;
        }
        File file = new File(dataFilePath);
        if (!file.exists()) {
            System.out.println("Data file not found at: " + dataFilePath);
            return;
        }
        BattleData data = objectMapper.readValue(file, BattleData.class);
        for (BattleDto dto : data.battles) {
            Battle battle = new Battle();
            battle.setName(dto.name);
            battle.setDate(dto.date);
            battle.setRegion(dto.region);
            battle.setCountry(dto.country);
            battle.setDescription(dto.description);
            battle.setResult(dto.result);
            battle.setBelligerents(dto.belligerents);
            battle.setCommanders(dto.commanders);
            battle.setCasualties(dto.casualties);
            battle.setImage(dto.image);
            battleRepository.save(battle);
        }
        System.out.println("Loaded " + data.battles.size() + " battles into the database.");
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class BattleData {
        public List<BattleDto> battles;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class BattleDto {
        public String name;
        public String date;
        public String region;
        public String country;
        public String description;
        public String result;
        public String belligerents;
        public String commanders;
        public String casualties;
        public String image;
    }
}

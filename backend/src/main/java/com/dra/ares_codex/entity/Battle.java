package com.dra.ares_codex.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "battles")
public class Battle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String date;
    private String region;
    private String country;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String result;

    @Column(columnDefinition = "TEXT")
    private String belligerents;

    @Column(columnDefinition = "TEXT")
    private String commanders;

    @Column(columnDefinition = "TEXT")
    private String casualties;

    private String image;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getBelligerents() { return belligerents; }
    public void setBelligerents(String belligerents) { this.belligerents = belligerents; }

    public String getCommanders() { return commanders; }
    public void setCommanders(String commanders) { this.commanders = commanders; }

    public String getCasualties() { return casualties; }
    public void setCasualties(String casualties) { this.casualties = casualties; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}

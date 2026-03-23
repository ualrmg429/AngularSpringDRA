package com.dra.ares_codex.controller;

import com.dra.ares_codex.entity.Battle;
import com.dra.ares_codex.repository.BattleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/battles")
@CrossOrigin(origins = "*")
public class BattleController {

    @Autowired
    private BattleRepository battleRepository;

    @GetMapping
    public List<Battle> getAllBattles() {
        List<Battle> battles = new ArrayList<>();
        battleRepository.findAll().forEach(battles::add);
        return battles;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Battle> getBattle(@PathVariable Long id) {
        return battleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

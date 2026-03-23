package com.dra.ares_codex.repository;

import com.dra.ares_codex.entity.Battle;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface BattleRepository extends CrudRepository<Battle, Long> {}
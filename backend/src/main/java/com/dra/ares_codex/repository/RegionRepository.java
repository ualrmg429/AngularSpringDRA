package com.dra.ares_codex.repository;

import com.dra.ares_codex.entity.Region;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.Optional;

@RepositoryRestResource
public interface RegionRepository extends CrudRepository<Region, Long> {
    Optional<Region> findByName(String name);
}
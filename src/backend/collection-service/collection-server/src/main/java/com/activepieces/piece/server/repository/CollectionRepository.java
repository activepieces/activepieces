package com.activepieces.piece.server.repository;

import com.activepieces.entity.nosql.Collection;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository("CollectionRepository")
public interface CollectionRepository extends MongoRepository<Collection, UUID> {


    Optional<Collection> findByProjectIdAndName(UUID projectId, String name);
}

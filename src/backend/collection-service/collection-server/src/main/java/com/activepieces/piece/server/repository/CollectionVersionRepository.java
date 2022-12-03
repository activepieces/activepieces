package com.activepieces.piece.server.repository;

import com.activepieces.entity.nosql.CollectionVersion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.UUID;

public interface CollectionVersionRepository extends MongoRepository<CollectionVersion, UUID> {

    List<CollectionVersion> findAllByCollectionId(UUID collectionId);

}

package com.activepieces.piece.server.repository;

import com.activepieces.entity.sql.CollectionVersion;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface CollectionVersionRepository extends CrudRepository<CollectionVersion, Ksuid> {

    List<CollectionVersion> findAllByCollectionId(Ksuid collectionId);

}

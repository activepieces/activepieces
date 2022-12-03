package com.activepieces.actions.store.server.repository;

import com.activepieces.entity.nosql.StoreValue;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreRepository extends CrudRepository<StoreValue, String> {

}

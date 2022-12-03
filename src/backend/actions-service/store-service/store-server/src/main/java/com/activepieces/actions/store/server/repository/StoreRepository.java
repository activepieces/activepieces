package com.activepieces.actions.store.server.repository;

import com.activepieces.entity.sql.StoreValue;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreRepository extends CrudRepository<StoreValue, String> {

}

package com.activepieces.flag.repository;

import com.activepieces.entity.sql.FlagValue;
import org.springframework.data.repository.CrudRepository;

public interface FlagRepository extends CrudRepository<FlagValue, String> {

}

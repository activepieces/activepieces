package com.activepieces.logging.server.repository;

import com.activepieces.common.pagination.PaginationRepository;
import com.activepieces.entity.sql.InstanceRun;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;

import java.util.UUID;

public interface InstanceRunRepository extends CrudRepository<InstanceRun, Ksuid>, PaginationRepository<InstanceRun, Ksuid> {


}

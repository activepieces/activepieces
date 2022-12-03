package com.activepieces.flow.repository;

import com.activepieces.common.pagination.PaginationRepository;
import com.activepieces.entity.sql.Flow;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;

import java.util.UUID;

public interface FlowRepository extends CrudRepository<Flow, Ksuid> , PaginationRepository<Flow, Ksuid> {

}

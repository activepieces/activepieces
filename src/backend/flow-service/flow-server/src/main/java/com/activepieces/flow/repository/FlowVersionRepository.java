package com.activepieces.flow.repository;

import com.activepieces.entity.sql.FlowVersion;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.UUID;

public interface FlowVersionRepository extends CrudRepository<FlowVersion, Ksuid> {

    List<FlowVersion> findAllByFlowIdOrderByCreated(Ksuid flowId);
}

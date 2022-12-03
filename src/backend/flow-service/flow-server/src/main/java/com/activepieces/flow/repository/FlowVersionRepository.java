package com.activepieces.flow.repository;

import com.activepieces.entity.nosql.FlowVersion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.UUID;

public interface FlowVersionRepository extends MongoRepository<FlowVersion, UUID> {

    List<FlowVersion> findAllByFlowIdOrderByEpochCreationTime(UUID flowId);
}
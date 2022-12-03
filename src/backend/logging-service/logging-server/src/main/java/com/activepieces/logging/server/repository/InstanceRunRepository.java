package com.activepieces.logging.server.repository;

import com.activepieces.entity.nosql.InstanceRun;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.UUID;

public interface InstanceRunRepository extends MongoRepository<InstanceRun, UUID> {

    int countByInstanceId(UUID instanceId);

}

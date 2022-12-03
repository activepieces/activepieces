package com.activepieces.flow.repository;

import com.activepieces.entity.nosql.Flow;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface FlowRepository extends MongoRepository<Flow, UUID> {

}

package com.activepieces.instance.server.repository;

import com.activepieces.entity.enums.InstanceStatus;
import com.activepieces.entity.nosql.Instance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("InstanceRepository")
public interface InstanceRepository extends MongoRepository<Instance, UUID> {

    List<Instance> findAllByCollectionVersionIdIn(List<UUID> pieceVersionId);


}

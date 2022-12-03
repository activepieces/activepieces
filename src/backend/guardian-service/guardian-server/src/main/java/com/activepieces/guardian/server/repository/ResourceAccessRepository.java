package com.activepieces.guardian.server.repository;

import com.activepieces.entity.sql.ResourceAccess;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceAccessRepository extends CrudRepository<ResourceAccess, UUID> {

  Optional<ResourceAccess> findByResourceIdAndPrincipleId(UUID resourceId, UUID principleId);

  List<ResourceAccess> findAllByPrincipleId(UUID roleResourceId);
}

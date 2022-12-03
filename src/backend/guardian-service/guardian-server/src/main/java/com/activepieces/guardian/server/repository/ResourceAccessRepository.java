package com.activepieces.guardian.server.repository;

import com.activepieces.entity.sql.ResourceAccess;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceAccessRepository extends CrudRepository<ResourceAccess, Ksuid> {

  Optional<ResourceAccess> findByResourceIdAndPrincipleId(Ksuid resourceId, Ksuid principleId);

  List<ResourceAccess> findAllByPrincipleId(Ksuid roleResourceId);
}

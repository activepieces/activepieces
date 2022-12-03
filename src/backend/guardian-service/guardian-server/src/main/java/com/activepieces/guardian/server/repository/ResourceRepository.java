package com.activepieces.guardian.server.repository;

import com.activepieces.entity.sql.Resource;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends CrudRepository<Resource, Ksuid> {

    List<Resource> findAllByParentResourceId(Ksuid parentResourceId);

}

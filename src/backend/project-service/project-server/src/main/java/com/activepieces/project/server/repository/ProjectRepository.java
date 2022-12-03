package com.activepieces.project.server.repository;

import com.activepieces.entity.sql.Project;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("ProjectRepository")
public interface ProjectRepository extends CrudRepository<Project, Ksuid> {

  List<Project> findAllByOwnerId(Ksuid ownerId);

}

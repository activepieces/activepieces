package com.activepieces.project.client.mapper;

import com.activepieces.entity.sql.Project;
import com.activepieces.project.client.model.ProjectView;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mappings;

import java.util.List;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class ProjectMapper {

  @Mappings({})
  public abstract Project fromView(ProjectView entity);

  @Mappings({})
  @ProjectToView
  public abstract ProjectView toView(Project entity);

  @IterableMapping(qualifiedBy = ProjectToView.class)
  public abstract List<ProjectView> toView(List<Project> children);


}

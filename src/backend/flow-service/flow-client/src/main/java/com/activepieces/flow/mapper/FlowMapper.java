package com.activepieces.flow.mapper;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.entity.nosql.Flow;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.SubclassExhaustiveStrategy;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.UUID;

@Mapper(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION
        , componentModel = "spring")
public abstract class FlowMapper {

  @Autowired
  private FlowVersionService flowVersionService;

  @Autowired
  private ErrorServiceHandler errorServiceHandler;

  @Mappings({
          @Mapping(target = "lastVersion", expression = "java(map(entity.getVersionsList()))"),
  })
  public abstract FlowView toView(Flow entity);

  @Mappings({})
  public abstract Flow fromView(FlowView entity);


  public FlowVersionView map(List<UUID> versionsList) {
    if (versionsList.isEmpty()) {
      return null;
    }
    try {
      return flowVersionService.get(versionsList.get(versionsList.size() - 1));
    } catch (FlowVersionNotFoundException | PermissionDeniedException e) {
      throw errorServiceHandler.createInternalError(e);
    }
  }

}

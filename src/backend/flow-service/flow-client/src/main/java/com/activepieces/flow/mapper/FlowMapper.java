package com.activepieces.flow.mapper;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.entity.sql.Flow;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.github.ksuid.Ksuid;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.SubclassExhaustiveStrategy;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

@Mapper(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION
        , componentModel = "spring")
public abstract class FlowMapper {

  @Autowired
  private FlowVersionService flowVersionService;

  @Mappings({
          @Mapping(target = "lastVersion", expression = "java(map(entity.getId()))"),
  })
  public abstract FlowView toView(Flow entity);

  @Mappings({})
  public abstract Flow fromView(FlowView entity);

  public FlowVersionView map(Ksuid flowId) {
    try {
      return flowVersionService.getLatest(flowId);
    } catch (PermissionDeniedException e) {
      throw new RuntimeException(e);
    }
  }

}

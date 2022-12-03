package com.activepieces.flow.mapper;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.entity.sql.Flow;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
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

  @Autowired
  private ErrorServiceHandler errorServiceHandler;

  @Mappings({
          @Mapping(target = "lastVersion", expression = "java(map(entity.getId()))"),
  })
  public abstract FlowView toView(Flow entity);

  @Mappings({})
  public abstract Flow fromView(FlowView entity);


  // TODO FIX
  public FlowVersionView map(Ksuid flowId) {
   return null;
  }

}

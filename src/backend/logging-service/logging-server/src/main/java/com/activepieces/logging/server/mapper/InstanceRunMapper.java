package com.activepieces.logging.server.mapper;

import com.activepieces.entity.nosql.InstanceRun;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mappings;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class InstanceRunMapper {

  @Autowired
  private ObjectMapper objectMapper;


  @Mappings({})
  public abstract InstanceRun fromView(InstanceRunView entity);

  @Mappings({})
  public abstract InstanceRunView toView(InstanceRun entity);

  @Mappings({})
  Map map(ExecutionStateView value){
      return objectMapper.convertValue(value, Map.class);
  }

  @Mappings({})
  ExecutionStateView map(Map value){
    return objectMapper.convertValue(value, ExecutionStateView.class);
  }

}

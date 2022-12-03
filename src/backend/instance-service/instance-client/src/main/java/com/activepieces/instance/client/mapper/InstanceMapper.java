package com.activepieces.instance.client.mapper;

import com.activepieces.entity.sql.Instance;
import com.activepieces.instance.client.model.InstanceView;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mappings;
import org.springframework.beans.factory.annotation.Autowired;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class InstanceMapper {

  @Autowired
  private ObjectMapper mapper;

  @Mappings({})
  public abstract Instance fromView(InstanceView entity);

  @Mappings({})
  public abstract InstanceView toView(Instance entity);

}

package com.activepieces.instance.client.mapper;

import com.activepieces.entity.sql.Instance;
import com.activepieces.instance.client.model.InstanceView;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.ksuid.Ksuid;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class InstanceMapper {

  @Autowired
  private ObjectMapper mapper;

  @Mappings({
          @Mapping(target = "flowVersionId", expression = "java(map(entity.getFlowVersionId()))"),
  })
  public abstract Instance fromView(InstanceView entity);

  @Mappings({
          @Mapping(target = "flowVersionId", expression = "java(mapToIds(entity.getFlowVersionId()))"),
  })
  public abstract InstanceView toView(Instance entity);

  public Map<String, String> map(Map<Ksuid, Ksuid> ids){
    return ids.entrySet().stream().map(f -> Map.entry(f.getKey().toString(), f.getValue().toString())).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
  }
  public Map<Ksuid, Ksuid> mapToIds(Map<String, String> ids){
    return ids.entrySet().stream().map(f -> Map.entry(Ksuid.fromString(f.getKey()), Ksuid.fromString(f.getValue()))).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
  }


}

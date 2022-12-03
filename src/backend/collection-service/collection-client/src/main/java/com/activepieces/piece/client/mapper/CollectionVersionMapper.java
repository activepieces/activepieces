package com.activepieces.piece.client.mapper;

import com.activepieces.common.utils.VariableMapperUtils;
import com.activepieces.entity.nosql.CollectionVersion;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.mapper.FlowVersionMapper;
import com.activepieces.flow.model.FlowVersionMetaView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionMetaVersionView;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class CollectionVersionMapper {

  @Mappings({})
  public abstract CollectionMetaVersionView toMeta(CollectionVersionView entity);

  public List<Variable<?>> map(List<Variable<?>> variables) {
    return variables;
  }

  @Mappings({
    @Mapping(target = "configs", expression = "java(map(entity.getConfigs()))"),
  })
  public abstract CollectionVersion fromView(CollectionVersionView entity);

  @Mappings({
    @Mapping(target = "configs", expression = "java(map(entity.getConfigs()))"),
  })
  public abstract CollectionVersionView toView(CollectionVersion entity);
}

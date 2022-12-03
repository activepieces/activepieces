package com.activepieces.piece.client.mapper;

import com.activepieces.entity.sql.CollectionVersion;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.piece.client.model.CollectionMetaVersionView;
import com.activepieces.piece.client.model.CollectionVersionView;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.List;

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

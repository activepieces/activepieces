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
  @Mappings({})
  public abstract CollectionVersion fromView(CollectionVersionView entity);

  @Mappings({})
  public abstract CollectionVersionView toView(CollectionVersion entity);
}

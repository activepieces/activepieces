package com.activepieces.actions.store.server.mapper;

import com.activepieces.actions.store.model.StoreValueView;
import com.activepieces.entity.sql.StoreValue;
import org.mapstruct.Mapper;
import org.mapstruct.Mappings;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class StoreMapper {

  @Mappings({})
  public abstract StoreValue fromView(StoreValueView entity);

  @Mappings({})
  public abstract StoreValueView toView(StoreValue entity);

}

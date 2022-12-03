package com.activepieces.apikey.client.mapper;

import com.activepieces.apikey.client.model.ApiKeyView;
import com.activepieces.entity.sql.ApiKey;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mappings;

import java.util.List;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class ApiKeyMapper {

  @Mappings({})
  public abstract ApiKey fromView(ApiKeyView entity);

  @Mappings({})
  @ApiKeyToView
  public abstract ApiKeyView toView(ApiKey entity);

  @IterableMapping(qualifiedBy = ApiKeyToView.class)
  public abstract List<ApiKeyView> toView(List<ApiKey> children);
}

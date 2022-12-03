package com.activepieces.piece.client.mapper;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.entity.nosql.Collection;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.UUID;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class CollectionMapper {

  @Autowired
  private CollectionVersionService collectionVersionService;

  @Autowired
  private ErrorServiceHandler errorServiceHandler;

  @Mappings({})
  public abstract Collection fromView(CollectionView entity);

  @Mappings({
          @Mapping(target = "lastVersion", expression = "java(map(entity.getVersionsList()))"),
  })
  public abstract CollectionView toView(Collection entity);

  public CollectionVersionView map(List<UUID> versionsList) {
    if (versionsList.isEmpty()) {
      return null;
    }
    try {
      return collectionVersionService.get(versionsList.get(versionsList.size() - 1));
    } catch (CollectionVersionNotFoundException | PermissionDeniedException e) {
      throw errorServiceHandler.createInternalError(e);
    }
  }

}

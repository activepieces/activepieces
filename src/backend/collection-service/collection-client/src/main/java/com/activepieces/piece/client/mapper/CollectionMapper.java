package com.activepieces.piece.client.mapper;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.entity.sql.Collection;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import com.github.ksuid.Ksuid;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.mapstruct.SubclassExhaustiveStrategy.COMPILE_ERROR;

@Mapper(subclassExhaustiveStrategy = COMPILE_ERROR, componentModel = "spring")
public abstract class CollectionMapper {

    @Autowired
    private CollectionVersionService collectionVersionService;

    @Mappings({})
    public abstract Collection fromView(CollectionView entity);

    @Mappings({
            @Mapping(target = "lastVersion", expression = "java(map(entity.getId()))"),
    })
    public abstract CollectionView toView(Collection entity);

    public CollectionVersionView map(Ksuid collectionId) {
        try {
            return collectionVersionService.getLatest(collectionId);
        } catch (PermissionDeniedException e) {
            throw new RuntimeException(e);
        }
    }

}

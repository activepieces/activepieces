package com.activepieces.piece.server.service;


import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.pagination.PageFilter;
import com.activepieces.common.pagination.PageOperator;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.sql.Collection;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.piece.client.CollectionService;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.mapper.CollectionMapper;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import com.activepieces.piece.client.model.CreatePieceRequest;
import com.activepieces.piece.server.repository.CollectionRepository;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;
    private final CollectionVersionService collectionVersionService;
    private final CollectionMapper collectionMapper;
    private final PermissionService permissionService;

    @Autowired
    public CollectionServiceImpl(
            @NonNull final CollectionRepository collectionRepository,
            @NonNull final CollectionMapper collectionMapper,
            @NonNull final CollectionVersionService collectionVersionService,
            @NonNull final PermissionService permissionService) {
        this.collectionRepository = collectionRepository;
        this.collectionVersionService = collectionVersionService;
        this.permissionService = permissionService;
        this.collectionMapper = collectionMapper;
    }

    @Override
    public SeekPage<CollectionView> listByProjectId(Ksuid projectId, SeekPageRequest request)
            throws PermissionDeniedException {
        permissionService.requiresPermission(projectId, Permission.READ_COLLECTION);
        final List<PageFilter> filters = List.of(new PageFilter(Collection.PROJECT_ID, PageOperator.EQUAL, projectId));
        return collectionRepository.findPageAsc( filters, request).convert(collectionMapper::toView);
    }


    @Override
    public CollectionView create(Ksuid projectId, CreatePieceRequest view)
            throws PermissionDeniedException, ResourceNotFoundException, CollectionVersionNotFoundException {
        permissionService.requiresPermission(projectId, Permission.WRITE_COLLECTION);
        Ksuid collectionId = Ksuid.newKsuid();

        Collection metadata = Collection.builder().id(collectionId).projectId(projectId).build();
        Collection result = collectionRepository.save(metadata);
        permissionService.createResourceWithParent(result.getId(), projectId, ResourceType.COLLECTION);

        CollectionVersionView collectionVersionView =
                collectionVersionService.create(
                        collectionId,
                        CollectionVersionView.builder()
                                .configs(Collections.emptyList())
                                .displayName(view.getDisplayName())
                                .build());
        return collectionMapper.toView(result);
    }

    @Override
    public Optional<CollectionView> getOptional(Ksuid id) throws PermissionDeniedException {
        Optional<Collection> optional = collectionRepository.findById(id);
        if (optional.isEmpty()) {
            return Optional.empty();
        }
        permissionService.requiresPermission(optional.get().getId(), Permission.READ_COLLECTION);
        CollectionView collectionView = collectionMapper.toView(optional.get());
        return Optional.of(collectionView);
    }

    @Override
    public CollectionView get(Ksuid id) throws CollectionNotFoundException, PermissionDeniedException {
        Optional<CollectionView> optional = getOptional(id);
        if (optional.isEmpty()) {
            throw new CollectionNotFoundException(id);
        }
        return optional.get();
    }

    @Override
    public CollectionView update(Ksuid id, CollectionVersionView view)
            throws CollectionNotFoundException, PermissionDeniedException, ResourceNotFoundException, CollectionVersionNotFoundException, CollectionVersionAlreadyLockedException {
        Optional<Collection> optional = collectionRepository.findById(id);
        if (optional.isEmpty()) {
            throw new CollectionNotFoundException(id);
        }
        permissionService.requiresPermission(id, Permission.WRITE_COLLECTION);
        CollectionView collectionView = get(id);
        CollectionVersionView draft;
        if (collectionView.getLastVersion().getState().equals(EditState.LOCKED)) {
            draft = collectionVersionService.create(id, view);
        } else {
            draft = collectionVersionService.update(collectionView.getLastVersion().getId(), view);
        }
        collectionView.updateOrCreateDraft(draft);
        return collectionMapper.toView(collectionRepository.save(collectionMapper.fromView(collectionView)));
    }


    public void delete(Ksuid id)
            throws CollectionNotFoundException, PermissionDeniedException {
        Optional<Collection> pieceOptional = collectionRepository.findById(id);
        if (pieceOptional.isEmpty()) {
            throw new CollectionNotFoundException(id);
        }
        permissionService.requiresPermission(id, Permission.WRITE_COLLECTION);
        collectionRepository.delete(pieceOptional.get());
    }
}

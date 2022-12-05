package com.activepieces.piece.server.service;

import com.activepieces.cache.ConditionalCache;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.collection.CollectionInvalidStateException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.sql.Collection;
import com.activepieces.entity.sql.CollectionVersion;
import com.activepieces.flow.FlowService;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.mapper.CollectionVersionMapper;
import com.activepieces.piece.client.model.CollectionMetaVersionView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.server.repository.CollectionRepository;
import com.activepieces.piece.server.repository.CollectionVersionRepository;
import com.github.ksuid.Ksuid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CollectionVersionServiceImpl implements CollectionVersionService {

    private final CollectionVersionRepository collectionVersionRepository;
    private final CollectionVersionMapper collectionVersionMapper;
    private final FlowVersionService flowVersionService;
    private final PermissionService permissionService;
    private final FlowService flowService;
    private final CollectionRepository collectionRepository;
    private final ErrorServiceHandler errorServiceHandler;
    private final ConditionalCache<Ksuid, Optional<CollectionVersion>> conditionalCache;

    @Autowired
    public CollectionVersionServiceImpl(
            final CollectionVersionRepository collectionVersionRepository,
            final FlowVersionService flowVersionService,
            final PermissionService permissionService,
            final ErrorServiceHandler errorServiceHandler,
            final CollectionRepository collectionRepository,
            final FlowService flowService,
            final CollectionVersionMapper collectionVersionMapper) {
        Function<Ksuid, Optional<CollectionVersion>> generatorFunction =
                collectionVersionRepository::findById;
        Function<Optional<CollectionVersion>, Boolean> cacheCondition =
                pieceVersionOptional ->
                        pieceVersionOptional.isPresent()
                                && pieceVersionOptional.get().getState().equals(EditState.LOCKED);
        this.conditionalCache = new ConditionalCache<>(generatorFunction, cacheCondition);

        this.collectionVersionMapper = collectionVersionMapper;
        this.permissionService = permissionService;
        this.collectionRepository = collectionRepository;
        this.errorServiceHandler = errorServiceHandler;
        this.flowService = flowService;
        this.flowVersionService = flowVersionService;
        this.collectionVersionRepository = collectionVersionRepository;
    }

    @Override
    public CollectionVersionView create(
            Ksuid collectionId,
            CollectionVersionView view)
            throws ResourceNotFoundException,
            PermissionDeniedException {
        permissionService.requiresPermission(collectionId, Permission.WRITE_COLLECTION);
        Ksuid newVersionIUd = Ksuid.newKsuid();
        CollectionVersionView savedView =
                saveFromView(
                        view.toBuilder()
                                .collectionId(collectionId)
                                .id(newVersionIUd)
                                .state(EditState.DRAFT)
                                .build());
        permissionService.createResourceWithParent(
                savedView.getId(), savedView.getCollectionId(), ResourceType.COLLECTION_VERSION);
        return savedView;
    }

    @Override
    public CollectionVersionView getLatest(Ksuid collectionId) throws PermissionDeniedException {
        permissionService.requiresPermission(collectionId, Permission.READ_COLLECTION);
        return collectionVersionMapper.toView(collectionVersionRepository.findFirstByCollectionIdOrderByIdDesc(collectionId));
    }

    @Override
    public Optional<CollectionVersionView> getOptional(Ksuid id) throws PermissionDeniedException {
        Optional<CollectionVersion> optional = conditionalCache.get(id);
        if (optional.isEmpty()) {
            return Optional.empty();
        }
        permissionService.requiresPermission(optional.get().getId(), Permission.READ_COLLECTION);
        return optional.map(collectionVersionMapper::toView);
    }

    @Override
    public CollectionVersionView get(Ksuid id)
            throws CollectionVersionNotFoundException, PermissionDeniedException {
        return getOptional(id).orElseThrow(() -> new CollectionVersionNotFoundException(id));
    }

    @Override
    public CollectionVersionView update(
            Ksuid id, CollectionVersionView view)
            throws PermissionDeniedException, CollectionVersionNotFoundException, CollectionVersionAlreadyLockedException {
        permissionService.requiresPermission(id, Permission.WRITE_COLLECTION);
        CollectionVersionView currentVersion = get(id);
        if (currentVersion.getState().equals(EditState.LOCKED)) {
            throw new CollectionVersionAlreadyLockedException(id);
        }
        CollectionVersionView savedView =
                saveFromView(
                        currentVersion.toBuilder()
                                .displayName(view.getDisplayName())
                                .configs(view.getConfigs())
                                .build());
        return saveFromView(savedView);
    }

    @Override
    public List<CollectionMetaVersionView> listByCollectionId(Ksuid collectionId)
            throws CollectionNotFoundException, PermissionDeniedException {
        permissionService.requiresPermission(collectionId, Permission.READ_COLLECTION);
        Optional<Collection> collection = collectionRepository.findById(collectionId);
        if (collection.isEmpty()) {
            throw new CollectionNotFoundException(collectionId);
        }
        return collectionVersionRepository.findAllByCollectionId(collectionId).stream()
                .map(version -> collectionVersionMapper.toMeta(collectionVersionMapper.toView(version)))
                .collect(Collectors.toList());
    }

    @Override
    public Map<Ksuid, Ksuid> commit(Ksuid collectionVersionId)
            throws PermissionDeniedException, CollectionVersionNotFoundException, FlowNotFoundException,
            CollectionInvalidStateException {
        permissionService.requiresPermission(collectionVersionId, Permission.WRITE_COLLECTION);
        CollectionVersionView currentVersion = get(collectionVersionId);
        List<FlowView> flowViews = flowService.listByCollectionId(currentVersion.getCollectionId(), new SeekPageRequest(null, Integer.MAX_VALUE)).getData();
        for (FlowView flowView : flowViews) {
            if (!flowView.getLastVersion().isValid()) {
                throw new CollectionInvalidStateException(currentVersion.getDisplayName());
            }
        }
        Map<Ksuid, Ksuid> flowVersionIds = flowViews.stream()
                        .map(f -> Map.entry( f.getId(),  f.getLastVersion().getId()))
                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        commitFlows(new ArrayList<>(flowVersionIds.values()));
        saveFromView(
                currentVersion.toBuilder().state(EditState.LOCKED).build());
        return flowVersionIds;
    }

    private void commitFlows(List<Ksuid> versionsList) {
        versionsList.forEach(
                f -> {
                    try {
                        FlowVersionView flowVersionView = flowVersionService.get(f);
                        try {
                            flowVersionService.lock(flowVersionView.getId());
                        } catch (FlowVersionAlreadyLockedException ignored) {
                        }
                    } catch (FlowVersionNotFoundException | PermissionDeniedException e) {
                        throw errorServiceHandler.createInternalError(CollectionVersionServiceImpl.class, e);
                    }
                });
    }

    private CollectionVersionView saveFromView(CollectionVersionView versionView) {
        return collectionVersionMapper.toView(
                collectionVersionRepository.save(collectionVersionMapper.fromView(versionView)));
    }
}

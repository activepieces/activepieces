package com.activepieces.piece.server.service;

import com.activepieces.actions.code.CodeArtifactService;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.AggregateKey;
import com.activepieces.common.PaginationService;
import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.common.error.exception.InvalidCodeArtifactException;
import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.entity.enums.*;
import com.activepieces.entity.nosql.Collection;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.entity.subdocuments.field.dropdown.DropdownVariable;
import com.activepieces.entity.subdocuments.field.dropdown.DropdownVariableType;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.piece.client.CollectionService;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.piece.client.mapper.CollectionMapper;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import com.activepieces.piece.client.model.CreatePieceRequest;
import com.activepieces.piece.server.repository.CollectionRepository;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Service
public class CollectionServiceImpl implements CollectionService {

  private final CollectionRepository collectionRepository;
  private final CollectionVersionService collectionVersionService;
  private final CollectionMapper collectionMapper;
  private final PermissionService permissionService;
  private final PaginationService paginationService;

  private final CodeArtifactService codeArtifactService;

  @Autowired
  public CollectionServiceImpl(
      @NonNull final CollectionRepository collectionRepository,
      @NonNull final CollectionMapper collectionMapper,
      @NonNull final CodeArtifactService codeArtifactService,
      @NonNull final PaginationService paginationService,
      @NonNull final CollectionVersionService collectionVersionService,
      @NonNull final PermissionService permissionService) {
    this.collectionRepository = collectionRepository;
    this.paginationService = paginationService;
    this.codeArtifactService = codeArtifactService;
    this.collectionVersionService = collectionVersionService;
    this.permissionService = permissionService;
    this.collectionMapper = collectionMapper;
  }

  @Override
  public SeekPage<CollectionView>  listByProjectId(UUID projectId, SeekPageRequest request, List<Criteria> criteria)
      throws CollectionNotFoundException, PermissionDeniedException {
    permissionService.requiresPermission(projectId, Permission.READ_COLLECTION);
    Collection startingAfter =
        Objects.nonNull(request.getStartingAfter())
            ? collectionMapper.fromView(get(request.getStartingAfter()))
            : null;
    Collection endingBefore =
        Objects.nonNull(request.getEndingBefore())
            ? collectionMapper.fromView(get(request.getEndingBefore()))
            : null;
    final AggregateKey aggregateKey =
        AggregateKey.builder().aggregateKey(Collection.PROJECT_ID).value(projectId).build();
    SeekPage<Collection> environmentSeekPage =
        paginationService.paginationTimeAsc(
            aggregateKey,
            startingAfter,
            endingBefore,
            request.getLimit(),
            Collection.class,
            criteria);
    return environmentSeekPage.convert(collectionMapper::toView);
  }


  @Override
  public CollectionView create(UUID projectId, CreatePieceRequest view, Optional<MultipartFile> logo, List<ArtifactFile> artifactFiles)
          throws PermissionDeniedException, ResourceNotFoundException, InvalidImageFormatException,
          IOException, CollectionVersionNotFoundException, InvalidCodeArtifactException {
    permissionService.requiresPermission(projectId, Permission.READ_COLLECTION);
    UUID collectionId = UUID.randomUUID();

    Collection metadata = new Collection();
    metadata.setId(collectionId);
    metadata.setProjectId(projectId);
    metadata.setVersionsList(Collections.emptyList());
    metadata.setEpochCreationTime(Instant.now().getEpochSecond());
    metadata.setEpochUpdateTime(Instant.now().getEpochSecond());
    CollectionView result = collectionMapper.toView(collectionRepository.save(metadata));
    permissionService.createResourceWithParent(result.getId(), projectId, ResourceType.COLLECTION);

    // We have to save piece first, so we can attach version to the piece in permission tree
    CollectionVersionView pieceVersion =
        collectionVersionService.create(
            collectionId,
            null,
            CollectionVersionView.builder()
                .flowsVersionId(Collections.emptySet())
                .configs(view.getVersion().getConfigs())
                .description(view.getVersion().getDescription())
                .displayName(view.getVersion().getDisplayName())
                .build(),
            logo);
    metadata.setVersionsList(Collections.singletonList(pieceVersion.getId()));
    result = collectionMapper.toView(collectionRepository.save(metadata));
    return result;
  }

  @Override
  public Optional<CollectionView> getOptional(UUID id) throws PermissionDeniedException {
    Optional<Collection> optional = collectionRepository.findById(id);
    if (optional.isEmpty()) {
      return Optional.empty();
    }
    permissionService.requiresPermission(optional.get().getId(), Permission.READ_COLLECTION);
    CollectionView collectionView = collectionMapper.toView(optional.get());
    return Optional.of(collectionView);
  }
  @Override
  public CollectionView get(UUID id) throws CollectionNotFoundException, PermissionDeniedException {
    Optional<CollectionView> optional = getOptional(id);
    if (optional.isEmpty()) {
      throw new CollectionNotFoundException(id);
    }
    return optional.get();
  }

  @Override
  public CollectionView update(UUID id, CollectionVersionView view, Optional<MultipartFile> logo, List<ArtifactFile> files)
          throws CollectionNotFoundException, PermissionDeniedException, ResourceNotFoundException,
          InvalidImageFormatException, IOException, CollectionVersionNotFoundException,
          CollectionVersionAlreadyLockedException, InvalidCodeArtifactException {
    Optional<Collection> optional = collectionRepository.findById(id);
    if (optional.isEmpty()) {
      throw new CollectionNotFoundException(id);
    }
    permissionService.requiresPermission(id, Permission.WRITE_COLLECTION);
    CollectionView collectionView = get(id);
    // Add logo file url from old value the logo file is missing
    view.setLogoUrl(collectionView.getLastVersion().getLogoUrl());
    CollectionVersionView draft = null;
    if (collectionView.getLastVersion().getState().equals(EditState.LOCKED)) {
      draft = collectionVersionService.create(id, collectionView.getLastVersion().getId(), view, logo);
    } else {
      draft = collectionVersionService.update(collectionView.getLastVersion().getId(), view, logo);
    }
    collectionView.updateOrCreateDraft(draft);
    collectionView.setEpochUpdateTime(Instant.now().getEpochSecond());
    return collectionMapper.toView(collectionRepository.save(collectionMapper.fromView(collectionView)));
  }


  @Override
  public void archive(UUID id)
      throws CollectionNotFoundException, PermissionDeniedException, ResourceNotFoundException {
    Optional<Collection> pieceOptional = collectionRepository.findById(id);
    if (pieceOptional.isEmpty()) {
      throw new CollectionNotFoundException(id);
    }
    permissionService.requiresPermission(id, Permission.WRITE_COLLECTION);
    collectionRepository.save(pieceOptional.get());
  }
}

package com.activepieces.piece.server.controller;

import com.activepieces.actions.code.CodeArtifactService;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.common.error.exception.InvalidCodeArtifactException;
import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.piece.client.CollectionService;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.common.error.exception.collection.CollectionInvalidStateException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.piece.client.model.CollectionView;
import com.activepieces.piece.client.model.CreatePieceRequest;
import com.activepieces.piece.client.model.CollectionVersionView;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping
@Hidden
public class CollectionController {

  private final CollectionService collectionService;
  private final CollectionVersionService collectionVersionService;
  private final CodeArtifactService codeArtifactService;

  @Autowired
  public CollectionController(
      @NonNull final CollectionService collectionService,
      @NonNull final CollectionVersionService collectionVersionService,
      @NonNull final CodeArtifactService codeArtifactService) {
    this.collectionService = collectionService;
    this.codeArtifactService = codeArtifactService;
    this.collectionVersionService = collectionVersionService;
  }

  @Secured(value = {"ROLE_API_KEY", "ROLE_USER"})
  @GetMapping( "/collections/{collectionId}")
  public ResponseEntity<CollectionView> get(@PathVariable("collectionId") UUID collectionId)
      throws CollectionNotFoundException, PermissionDeniedException {
    CollectionView collectionView = collectionService.get(collectionId);
    return ResponseEntity.ok(collectionView);
  }

  @Secured(value = {"ROLE_API_KEY", "ROLE_USER"})
  @GetMapping({"/projects/{projectId}/collections"})
  public ResponseEntity<SeekPage<CollectionView>> list(
      @PathVariable("projectId") UUID projectId,
      @RequestParam(value = "startingAfter", required = false) UUID startingAfter,
      @RequestParam(value = "limit", defaultValue = "10", required = false) int limit)
      throws PermissionDeniedException, CollectionNotFoundException {
    return ResponseEntity.ok(
        collectionService.listByProjectId(
            projectId, new SeekPageRequest(startingAfter, null, limit), new ArrayList<>()));
  }

  @PostMapping( "/projects/{projectId}/collections")
  public ResponseEntity<CollectionView> create(
      @PathVariable("projectId") UUID projectId,
      @RequestPart(value = "collection") @Valid CreatePieceRequest request,
      @RequestPart(value = "logo", required = false) MultipartFile file,
      @RequestPart(value = "artifacts", required = false) MultipartFile[] files)
          throws PermissionDeniedException, ResourceNotFoundException, InvalidImageFormatException,
          IOException, CollectionVersionNotFoundException, CollectionNotFoundException, InvalidCodeArtifactException {
    List<MultipartFile> fileList =
            Objects.isNull(files) ? Collections.emptyList() : Arrays.asList(files);

    List<ArtifactFile> artifactFiles = codeArtifactService.toArtifacts(fileList);
    return ResponseEntity.ok(collectionService.create(projectId, request, Optional.ofNullable(file), artifactFiles));
  }

  @PutMapping("/collections/{collectionId}")
  public ResponseEntity<CollectionView> update(
      @PathVariable("collectionId") UUID collectionId,
      @RequestPart(value = "collection") @Valid CollectionVersionView request,
      @RequestPart(value = "logo", required = false) MultipartFile file,
      @RequestPart(value = "artifacts", required = false) MultipartFile[] files)
          throws PermissionDeniedException, CollectionNotFoundException, ResourceNotFoundException,
          InvalidImageFormatException, IOException, CollectionVersionNotFoundException,
          CollectionVersionAlreadyLockedException, InvalidCodeArtifactException {
    List<MultipartFile> fileList =
            Objects.isNull(files) ? Collections.emptyList() : Arrays.asList(files);

    List<ArtifactFile> artifactFiles = codeArtifactService.toArtifacts(fileList);
    return ResponseEntity.ok(collectionService.update(collectionId, request, Optional.ofNullable(file), artifactFiles));
  }

  @PostMapping("/collections/{collectionId}/commit")
  public ResponseEntity<CollectionView> commit(@PathVariable("collectionId") UUID collectionId)
      throws PermissionDeniedException, CollectionNotFoundException, CollectionVersionNotFoundException,
          CollectionVersionAlreadyLockedException, FlowNotFoundException, CollectionInvalidStateException {
    CollectionView collectionView = collectionService.get(collectionId);
    collectionVersionService.commit(collectionView.getLastVersion().getId());
    return ResponseEntity.ok(collectionService.get(collectionId));
  }

  @DeleteMapping("/collections/{collectionId}")
  public void delete(@PathVariable("collectionId") UUID collectionId)
      throws PermissionDeniedException, CollectionNotFoundException, ResourceNotFoundException {
    collectionService.archive(collectionId);
  }
}

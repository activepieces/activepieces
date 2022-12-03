package com.activepieces.piece.server.controller;

import com.activepieces.actions.code.CodeArtifactService;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.error.exception.InvalidCodeArtifactException;
import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.common.error.exception.collection.CollectionInvalidStateException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.pagination.Cursor;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.piece.client.CollectionService;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import com.activepieces.piece.client.model.CreatePieceRequest;
import com.github.ksuid.Ksuid;
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
  @Autowired
  public CollectionController(
      @NonNull final CollectionService collectionService,
      @NonNull final CollectionVersionService collectionVersionService) {
    this.collectionService = collectionService;
    this.collectionVersionService = collectionVersionService;
  }

  @Secured(value = {"ROLE_API_KEY", "ROLE_USER"})
  @GetMapping( "/collections/{collectionId}")
  public ResponseEntity<CollectionView> get(@PathVariable("collectionId") Ksuid collectionId)
      throws CollectionNotFoundException, PermissionDeniedException {
    CollectionView collectionView = collectionService.get(collectionId);
    return ResponseEntity.ok(collectionView);
  }

  @Secured(value = {"ROLE_API_KEY", "ROLE_USER"})
  @GetMapping({"/projects/{projectId}/collections"})
  public ResponseEntity<SeekPage<CollectionView>> list(
      @PathVariable("projectId") Ksuid projectId,
      @RequestParam(value = "cursor", required = false) Cursor cursor,
      @RequestParam(value = "limit", defaultValue = "10", required = false) int limit)
      throws PermissionDeniedException, CollectionNotFoundException {
    return ResponseEntity.ok(
        collectionService.listByProjectId(
            projectId, new SeekPageRequest(cursor,  limit)));
  }

  @PostMapping( "/projects/{projectId}/collections")
  public ResponseEntity<CollectionView> create(
      @PathVariable("projectId") Ksuid projectId,
      @RequestBody @Valid CreatePieceRequest request)
          throws PermissionDeniedException, ResourceNotFoundException, InvalidImageFormatException,
          IOException, CollectionVersionNotFoundException, CollectionNotFoundException, InvalidCodeArtifactException {
    return ResponseEntity.ok(collectionService.create(projectId, request));
  }

  @PutMapping("/collections/{collectionId}")
  public ResponseEntity<CollectionView> update(
      @PathVariable("collectionId") Ksuid collectionId,
      @RequestBody @Valid CollectionVersionView request)
          throws PermissionDeniedException, CollectionNotFoundException, ResourceNotFoundException,
          InvalidImageFormatException, IOException, CollectionVersionNotFoundException,
          CollectionVersionAlreadyLockedException, InvalidCodeArtifactException {
    return ResponseEntity.ok(collectionService.update(collectionId, request));
  }

  @PostMapping("/collections/{collectionId}/commit")
  public ResponseEntity<CollectionView> commit(@PathVariable("collectionId") Ksuid collectionId)
      throws PermissionDeniedException, CollectionNotFoundException, CollectionVersionNotFoundException,
          CollectionVersionAlreadyLockedException, FlowNotFoundException, CollectionInvalidStateException {
    CollectionView collectionView = collectionService.get(collectionId);
    collectionVersionService.commit(collectionView.getLastVersion().getId());
    return ResponseEntity.ok(collectionService.get(collectionId));
  }

  @DeleteMapping("/collections/{collectionId}")
  public void delete(@PathVariable("collectionId") Ksuid collectionId)
      throws PermissionDeniedException, CollectionNotFoundException, ResourceNotFoundException {
    collectionService.archive(collectionId);
  }
}

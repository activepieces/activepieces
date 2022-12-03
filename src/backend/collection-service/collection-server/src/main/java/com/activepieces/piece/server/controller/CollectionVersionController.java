package com.activepieces.piece.server.controller;

import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.piece.client.CollectionService;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionMetaVersionView;
import com.activepieces.project.client.ProjectService;
import com.activepieces.project.client.exception.ProjectNotFoundException;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@Hidden
@RequestMapping
public class CollectionVersionController {

  private final CollectionVersionService collectionVersionService;

  @Autowired
  public CollectionVersionController(
      @NonNull final CollectionVersionService collectionVersionService) {
    this.collectionVersionService = collectionVersionService;
  }

  @GetMapping( "/collection-versions/{versionId}")
  public ResponseEntity<CollectionVersionView> get(@PathVariable("versionId") UUID versionId)
      throws PermissionDeniedException, CollectionVersionNotFoundException {
    CollectionVersionView pieceView = collectionVersionService.get(versionId);
    return ResponseEntity.ok(pieceView);
  }

  @Secured(value = {"ROLE_API_KEY", "ROLE_USER"})
  @GetMapping( "/collections/{collectionId}/versions")
  public ResponseEntity<List<CollectionMetaVersionView>> list(@PathVariable("collectionId") UUID collectionId)
      throws PermissionDeniedException, CollectionNotFoundException {
    return ResponseEntity.ok(collectionVersionService.listByCollectionId(collectionId));
  }


}

package com.activepieces.actions.store.server.controller;

import com.activepieces.actions.store.GetStorageRequest;
import com.activepieces.actions.store.PutStorageRequest;
import com.activepieces.actions.store.StorageService;
import com.activepieces.actions.store.model.StorePath;
import com.activepieces.actions.store.model.StoreValueView;
import com.activepieces.common.identity.WorkerIdentity;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Optional;

@CrossOrigin
@RestController
@Hidden
@RequestMapping
public class StorageController {

  private final StorageService storageService;

  @Autowired
  public StorageController(@NonNull final StorageService storageService) {
    this.storageService = storageService;
  }

  @Secured("ROLE_WORKER")
  @PostMapping("/storage")
  public ResponseEntity<Object> put(
      @AuthenticationPrincipal WorkerIdentity workerIdentity,
      @RequestBody @Valid PutStorageRequest storageRequest) {
    final StorePath storePath = StorePath.fromIdentity(storageRequest.getScope(), workerIdentity).paths(storageRequest.getStorePath());
    StoreValueView storeValueView = storageService.put(storePath, storageRequest.getValue());
    return ResponseEntity.ok(storeValueView.getValue());
  }

  @Secured("ROLE_WORKER")
  @GetMapping("/storage")
  public ResponseEntity<Object> get(
      @AuthenticationPrincipal WorkerIdentity workerIdentity,
      @RequestBody @Valid GetStorageRequest storageRequest) {
    final StorePath storePath = StorePath.fromIdentity(storageRequest.getScope(), workerIdentity).paths(storageRequest.getStorePath());
    Optional<StoreValueView> storeValueView = storageService.get(storePath);
    if(storeValueView.isEmpty()){
      return ResponseEntity.ok(null);
    }
    return ResponseEntity.ok(storeValueView.get().getValue());
  }
}

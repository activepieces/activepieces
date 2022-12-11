package com.activepieces.actions.store.model;

import com.activepieces.common.identity.WorkerIdentity;
import com.activepieces.entity.enums.StoreScope;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Builder
@AllArgsConstructor
@Setter
@Getter
public class StorePath {

  @JsonProperty private List<String> paths;

  public StorePath() {
    this.paths = new ArrayList<>();
  }

  public static StorePath collection(@NonNull Ksuid collectionId) {
    return new StorePath()
            .scope("collection")
            .scope(collectionId.toString());
  }

  public static StorePath testScope(
      @NonNull Ksuid collectionId) {
    return new StorePath()
        .scope("collection")
        .scope(collectionId.toString())
        .scope("test");
  }

  public StorePath paths(List<String> morePaths) {
    List<String> paths = new ArrayList<>(this.paths);
    paths.addAll(morePaths);
    return new StorePath(paths);
  }

  private StorePath scope(String path) {
    List<String> paths = new ArrayList<>(this.paths);
    paths.add(path);
    return new StorePath(paths);
  }

  public static StorePath fromIdentity(StoreScope scope, WorkerIdentity workerIdentity){
    switch (scope){
      case COLLECTION:
        return StorePath.collection(workerIdentity.getCollectionId());
    }
    throw new RuntimeException("Unsupported Store scope " + scope.toString());
  }
}

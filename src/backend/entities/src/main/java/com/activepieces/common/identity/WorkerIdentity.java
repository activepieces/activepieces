package com.activepieces.common.identity;

import com.github.ksuid.Ksuid;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
public class WorkerIdentity extends PrincipleIdentity {

  private final Ksuid collectionId;
  private final Ksuid flowId;

  @Builder
  public WorkerIdentity(Ksuid collectionId, Ksuid flowId) {
    super(Ksuid.newKsuid(), PrincipleType.WORKER);
    this.collectionId = collectionId;
    this.flowId = flowId;
  }
}

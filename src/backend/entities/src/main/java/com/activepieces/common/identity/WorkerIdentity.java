package com.activepieces.common.identity;

import com.github.ksuid.Ksuid;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
public class WorkerIdentity extends PrincipleIdentity {

  private final Ksuid collectionId;
  private final Ksuid flowId;
  private final Ksuid instanceId;

  @Builder
  public WorkerIdentity(Ksuid collectionId, Ksuid flowId, Ksuid instanceId) {
    super(Ksuid.newKsuid(), PrincipleType.WORKER);
    this.collectionId = collectionId;
    this.flowId = flowId;
    this.instanceId = instanceId;
  }
}

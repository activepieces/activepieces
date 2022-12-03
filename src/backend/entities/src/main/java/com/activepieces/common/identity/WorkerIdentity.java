package com.activepieces.common.identity;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
public class WorkerIdentity extends PrincipleIdentity {

  private final UUID collectionId;
  private final UUID flowId;
  private final UUID instanceId;

  @Builder
  public WorkerIdentity(UUID collectionId, UUID flowId, UUID instanceId) {
    super(UUID.randomUUID(), PrincipleType.WORKER);
    this.collectionId = collectionId;
    this.flowId = flowId;
    this.instanceId = instanceId;
  }
}

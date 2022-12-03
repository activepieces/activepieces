package com.activepieces.common.identity;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
public class ApiKeyIdentity extends PrincipleIdentity {

  private final UUID id;
  private final UUID projectId;

  @Builder
  public ApiKeyIdentity(UUID id, UUID projectId) {
    super(id, PrincipleType.API_KEY);
    this.id = id;
    this.projectId = projectId;
  }
}

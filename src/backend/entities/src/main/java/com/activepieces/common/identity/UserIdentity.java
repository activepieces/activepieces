package com.activepieces.common.identity;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
public class UserIdentity extends PrincipleIdentity {

  @Builder
  public UserIdentity(UUID resourceId) {
    super(resourceId, PrincipleType.USER);
  }
}

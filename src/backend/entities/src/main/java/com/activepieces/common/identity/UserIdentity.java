package com.activepieces.common.identity;

import com.github.ksuid.Ksuid;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
public class UserIdentity extends PrincipleIdentity {

  @Builder
  public UserIdentity(Ksuid resourceId) {
    super(resourceId, PrincipleType.USER);
  }
}

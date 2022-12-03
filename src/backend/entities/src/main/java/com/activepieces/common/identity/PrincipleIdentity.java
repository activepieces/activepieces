package com.activepieces.common.identity;


import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class PrincipleIdentity {

  private Ksuid id;

  private PrincipleType principleType;
}

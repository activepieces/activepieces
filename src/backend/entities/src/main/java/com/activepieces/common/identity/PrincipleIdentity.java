package com.activepieces.common.identity;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class PrincipleIdentity {

  private UUID id;

  private PrincipleType principleType;
}

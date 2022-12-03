package com.activepieces.common.identity;

public enum PrincipleType {
  USER("ROLE_USER"),
  WORKER("ROLE_WORKER");
  private final String type;

  PrincipleType(String type) {
    this.type = type;
  }

  public String getType() {
    return type;
  }
}

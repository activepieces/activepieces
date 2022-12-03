package com.activepieces.guardian.client.exception;

import java.util.UUID;

public class ResourceNotFoundException extends Exception {

  private final UUID id;

  public ResourceNotFoundException(UUID id) {
    super(String.format("Resource with Id=%s not found", id.toString()));
    this.id = id;
  }

  public UUID getId(){
    return this.id;
  }

}

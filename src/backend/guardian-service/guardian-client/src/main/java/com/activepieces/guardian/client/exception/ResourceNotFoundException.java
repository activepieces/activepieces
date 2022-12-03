package com.activepieces.guardian.client.exception;

import com.github.ksuid.Ksuid;


public class ResourceNotFoundException extends Exception {

  private final Ksuid id;

  public ResourceNotFoundException(Ksuid id) {
    super(String.format("Resource with Id=%s not found", id.toString()));
    this.id = id;
  }

  public Ksuid getId(){
    return this.id;
  }

}

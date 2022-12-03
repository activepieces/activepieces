package com.activepieces.common.error.exception;

import java.util.UUID;

public class ActionNotFoundException extends Exception {

  public ActionNotFoundException(UUID id) {
    super(String.format("ActionNotFoundException is not found with id=%s", id.toString()));
  }
}

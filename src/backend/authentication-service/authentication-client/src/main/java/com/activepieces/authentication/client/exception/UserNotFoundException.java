package com.activepieces.authentication.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class UserNotFoundException extends Exception implements ErrorResponseException {

  public UserNotFoundException(String id) {
    super(String.format("User with email=%s is not found", id.toString()));
  }

  public UserNotFoundException(UUID id) {
    super(String.format("User with id=%s is not found", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.USER_NOT_FOUND;
  }
}

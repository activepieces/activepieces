package com.activepieces.authentication.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

import java.util.UUID;

public class UserNotFoundException extends Exception implements ErrorResponseException {

  public UserNotFoundException(Ksuid id) {
    super(String.format("User with id=%s is not found", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.USER_NOT_FOUND;
  }
}

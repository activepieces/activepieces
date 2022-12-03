package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class ApiKeyNotFoundException extends Exception implements ErrorResponseException {

  public ApiKeyNotFoundException(String api) {
    super(String.format("ApiKeyNotFoundException is not found with key=%s", api.toString()));
  }

  public ApiKeyNotFoundException(UUID id) {
    super(String.format("ApiKeyNotFoundException is not found with id=%s", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.API_KEY_NOT_FOUND;
  }
}

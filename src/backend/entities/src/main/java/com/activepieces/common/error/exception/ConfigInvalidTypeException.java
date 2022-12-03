package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class ConfigInvalidTypeException extends Exception implements ErrorResponseException {

  public ConfigInvalidTypeException(UUID id, String key) {
    super(String.format("Version id=%s with key=%s type is not auth", id.toString(), key));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.INVALID_CONFIG;
  }
}

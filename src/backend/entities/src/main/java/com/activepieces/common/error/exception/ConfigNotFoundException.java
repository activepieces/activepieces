package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class ConfigNotFoundException extends Exception implements ErrorResponseException {

  public ConfigNotFoundException(UUID id, String key) {
    super(String.format("Version id=%s with key=%s is not found", id.toString(), key));
  }

  public ConfigNotFoundException(String key) {
    super(String.format("Variable with key=%s is not found and its used, make sure its not deleted", key));
  }
  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.CONFIG_NOT_FOUND;
  }
}

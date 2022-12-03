package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class ConfigNotDynamicException extends Exception implements ErrorResponseException {

  public ConfigNotDynamicException(String key) {
    super(String.format("Config with key=%s is not dynamic", key));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.CONFIG_NOT_DYNAMIC;
  }
}

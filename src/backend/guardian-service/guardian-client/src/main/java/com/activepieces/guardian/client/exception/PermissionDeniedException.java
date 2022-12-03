package com.activepieces.guardian.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class PermissionDeniedException extends Exception implements ErrorResponseException {

  public PermissionDeniedException(String message) {
    super(message);
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.PERMISSION_DENIED;
  }
}

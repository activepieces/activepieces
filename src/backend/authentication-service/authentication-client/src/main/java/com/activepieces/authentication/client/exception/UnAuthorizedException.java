package com.activepieces.authentication.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class UnAuthorizedException extends Exception implements ErrorResponseException {

  public UnAuthorizedException() {
    super("Unauthorized operation");
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.UNAUTHORIZED;
  }
}

package com.activepieces.authentication.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class UnAuthenticationException extends Exception implements ErrorResponseException {

  public UnAuthenticationException() {
    super("Wrong credentials is provided");
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.UNAUTHENTICATED;
  }
}

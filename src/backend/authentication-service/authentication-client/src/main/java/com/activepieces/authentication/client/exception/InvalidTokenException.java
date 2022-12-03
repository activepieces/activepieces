package com.activepieces.authentication.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class InvalidTokenException extends Exception implements ErrorResponseException {

  public InvalidTokenException() {
    super("Token is invalid");
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.INVALID_TOKEN;
  }
}

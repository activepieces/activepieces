package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class InvalidCodeArtifactException extends Exception implements ErrorResponseException {

  public InvalidCodeArtifactException(String filename) {
    super(String.format("file with name=%s must be zip file, check content type", filename));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.INVALID_CODE_ARTIFACT;
  }
}

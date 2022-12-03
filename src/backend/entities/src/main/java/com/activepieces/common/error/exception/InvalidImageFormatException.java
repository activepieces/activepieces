package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class InvalidImageFormatException extends Exception implements ErrorResponseException {

  public InvalidImageFormatException(String fileName) {
    super(String.format("Invalid image format for filename=%s", fileName));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.INVALID_IMAGE_FORMAT;
  }
}

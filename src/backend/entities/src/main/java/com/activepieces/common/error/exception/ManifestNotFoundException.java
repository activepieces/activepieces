package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class ManifestNotFoundException extends Exception implements ErrorResponseException {


  public ManifestNotFoundException(String componentName, String componentVersion, String message) {
    super(String.format("Manifest not found for componentName=%s and componentVersion=%s, message=%s", componentName, componentVersion, message));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.MANIFEST_NOT_FOUND;
  }
}

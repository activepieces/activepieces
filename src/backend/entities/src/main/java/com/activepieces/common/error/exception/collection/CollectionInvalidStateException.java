package com.activepieces.common.error.exception.collection;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class CollectionInvalidStateException extends Exception implements ErrorResponseException {

  public CollectionInvalidStateException(String name) {
    super(String.format("Collection name %s flows contains errors, please fix them first", name));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.COLLECTION_INVALID_STATE;
  }
}

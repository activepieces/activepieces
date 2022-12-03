package com.activepieces.common.error.exception.collection;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class CollectionVersionAlreadyLockedException extends Exception implements ErrorResponseException {

  public CollectionVersionAlreadyLockedException(UUID id) {
    super(String.format("Collection version id=%s is locked, create new version", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.COLLECTION_VERSION_LOCKED;
  }
}

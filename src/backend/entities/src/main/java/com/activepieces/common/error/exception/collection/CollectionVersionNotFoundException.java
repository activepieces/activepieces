package com.activepieces.common.error.exception.collection;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class CollectionVersionNotFoundException extends Exception implements ErrorResponseException {

  public CollectionVersionNotFoundException(UUID id) {
    super(String.format("Collection version with id=%s is not found", id));
  }
  public CollectionVersionNotFoundException(UUID collectionId, int version) {
    super(String.format("Collection version with piece Id=%s and version=%d is not found", collectionId, version));
  }
  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.COLLECTION_NOT_FOUND;
  }
}

package com.activepieces.common.error.exception.collection;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

import java.util.UUID;

public class CollectionVersionNotFoundException extends Exception implements ErrorResponseException {

  public CollectionVersionNotFoundException(Ksuid id) {
    super(String.format("Collection version with id=%s is not found", id));
  }
  public CollectionVersionNotFoundException(Ksuid collectionId, int version) {
    super(String.format("Collection version with piece Id=%s and version=%d is not found", collectionId, version));
  }
  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.COLLECTION_NOT_FOUND;
  }
}

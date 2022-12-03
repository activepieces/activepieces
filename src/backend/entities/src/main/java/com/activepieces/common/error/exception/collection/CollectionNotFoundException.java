package com.activepieces.common.error.exception.collection;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

import java.util.UUID;

public class CollectionNotFoundException extends Exception implements ErrorResponseException {

  public CollectionNotFoundException(Ksuid id) {
    super(String.format("Collection with id=%s is not found", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.COLLECTION_NOT_FOUND;
  }
}

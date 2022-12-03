package com.activepieces.common.error.exception.collection;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class CollectionNotFoundException extends Exception implements ErrorResponseException {

  public CollectionNotFoundException(UUID id) {
    super(String.format("Collection with id=%s is not found", id.toString()));
  }

  public CollectionNotFoundException(UUID projectId, String name) {
    super(String.format("Collection with projectId=%s and name=%s is not found", projectId.toString(), name));
  }
  public CollectionNotFoundException(String projectName, String name) {
    super(String.format("Collection with projectName=%s and name=%s is not found", projectName, name));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.COLLECTION_NOT_FOUND;
  }
}

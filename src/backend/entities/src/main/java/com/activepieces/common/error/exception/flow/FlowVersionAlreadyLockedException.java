package com.activepieces.common.error.exception.flow;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class FlowVersionAlreadyLockedException extends Exception implements ErrorResponseException {

  public FlowVersionAlreadyLockedException(UUID id) {
    super(String.format("Flow version id=%s is locked, create new version", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.FLOW_VERSION_LOCKED;
  }
}

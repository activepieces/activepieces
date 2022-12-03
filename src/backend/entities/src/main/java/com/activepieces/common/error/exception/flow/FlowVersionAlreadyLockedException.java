package com.activepieces.common.error.exception.flow;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

import java.util.UUID;

public class FlowVersionAlreadyLockedException extends Exception implements ErrorResponseException {

  public FlowVersionAlreadyLockedException(Ksuid id) {
    super(String.format("Flow version id=%s is locked, create new version", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.FLOW_VERSION_LOCKED;
  }
}

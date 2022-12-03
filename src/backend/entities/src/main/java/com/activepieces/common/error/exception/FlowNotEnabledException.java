package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class FlowNotEnabledException extends Exception implements ErrorResponseException {

  public FlowNotEnabledException(UUID id, UUID instanceId) {
    super(
        String.format(
            "Flow with id=%s not enabled in instanceId=%s", id.toString(), instanceId.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.FLOW_NOT_ENABLED;
  }
}

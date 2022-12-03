package com.activepieces.logging.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

import java.util.UUID;

public class InstanceRunNotFoundException extends Exception implements ErrorResponseException {


  public InstanceRunNotFoundException(Ksuid runId) {
    super(String.format("Instance run with id=%s is not found", runId.toString()));
  }


  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.INSTANCE_RUN_LOG_NOT_FOUND;
  }
}

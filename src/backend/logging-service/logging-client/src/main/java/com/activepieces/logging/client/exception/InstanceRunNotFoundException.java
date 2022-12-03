package com.activepieces.logging.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class InstanceRunNotFoundException extends Exception implements ErrorResponseException {

  private final UUID runId;

  public InstanceRunNotFoundException(UUID runId) {
    super(String.format("Instance run with id=%s is not found", runId.toString()));
    this.runId = runId;
  }

  public UUID getRunId(){
    return this.runId;
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.INSTANCE_RUN_LOG_NOT_FOUND;
  }
}

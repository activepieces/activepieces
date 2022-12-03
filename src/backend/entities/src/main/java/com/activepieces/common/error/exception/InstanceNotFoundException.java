package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class InstanceNotFoundException extends Exception implements ErrorResponseException {

  private final UUID instanceId;

  public InstanceNotFoundException(UUID instanceId) {
    super(String.format("Instance with id=%s not found", instanceId.toString()));
    this.instanceId = instanceId;
  }

  public UUID getInstanceId(){
    return instanceId;
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.INSTANCE_NOT_FOUND;
  }
}

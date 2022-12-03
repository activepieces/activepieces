package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

import java.util.UUID;

public class InstanceNotFoundException extends Exception implements ErrorResponseException {

  private final Ksuid instanceId;

  public InstanceNotFoundException(Ksuid instanceId) {
    super(String.format("Instance with id=%s not found", instanceId.toString()));
    this.instanceId = instanceId;
  }

  public Ksuid getInstanceId(){
    return instanceId;
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.INSTANCE_NOT_FOUND;
  }
}

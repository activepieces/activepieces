package com.activepieces.common.error.exception.flow;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

import java.util.UUID;

public class FlowVersionNotFoundException extends Exception implements ErrorResponseException {

  public FlowVersionNotFoundException(Ksuid id) {
    super(String.format("Flow Version with id=%s is not found", id.toString()));
  }

  public FlowVersionNotFoundException(Ksuid CollectionId, Ksuid flow) {
    super(String.format("Flow Version for CollectionId=%s and flowName=%s is not found", CollectionId.toString(), flow.toString()));
  }

  public FlowVersionNotFoundException(Ksuid instanceId, Ksuid flow, boolean instance) {
    super(String.format("Flow Version for Instance=%s and flowId=%s is not found", instanceId.toString(), flow.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.FLOW_VERSION_NOT_FOUND;
  }
}

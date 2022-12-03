package com.activepieces.common.error.exception.flow;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class FlowNotFoundException extends Exception implements ErrorResponseException {

  public FlowNotFoundException(UUID id) {
    super(String.format("FlowNotFoundException is not found with id=%s", id.toString()));
  }
  public FlowNotFoundException(UUID pieceId, String flowName) {
    super(String.format("FlowNotFoundException is not found with Piece id=%s and name=%s", pieceId.toString(), flowName));
  }
  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.FLOW_NOT_FOUND;
  }
}

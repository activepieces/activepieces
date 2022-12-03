package com.activepieces.project.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.util.UUID;

public class ProjectNotFoundException extends Exception implements ErrorResponseException {

  public ProjectNotFoundException(UUID id) {
    super(String.format("Project with id=%s is not found", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.PROJECT_NOT_FOUND;
  }
}

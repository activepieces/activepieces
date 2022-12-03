package com.activepieces.project.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import com.github.ksuid.Ksuid;

import java.util.UUID;

public class ProjectNotFoundException extends Exception implements ErrorResponseException {

  public ProjectNotFoundException(Ksuid id) {
    super(String.format("Project with id=%s is not found", id.toString()));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.PROJECT_NOT_FOUND;
  }
}

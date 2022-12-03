package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import org.apache.maven.artifact.Artifact;

public class CodeArtifactBuildFailure extends Exception implements ErrorResponseException {

  public CodeArtifactBuildFailure(String fileName, Exception e) {
    super(String.format("Artifact with path %s building failed with exception", fileName, e));
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.ARTIFACT_BUILD_FAILED;
  }
}

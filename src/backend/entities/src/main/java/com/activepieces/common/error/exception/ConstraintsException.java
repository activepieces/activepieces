package com.activepieces.common.error.exception;

import com.activepieces.common.error.ErrorResponse;

import java.util.Set;

public class ConstraintsException extends RuntimeException {

  private final Set<ErrorResponse> errorResponse;
  public ConstraintsException(Set<ErrorResponse> errorResponse) {
    super(errorResponse.toString());
    this.errorResponse = errorResponse;
  }

  public Set<ErrorResponse> getErrorResponse(){
   return  errorResponse;
  }


}

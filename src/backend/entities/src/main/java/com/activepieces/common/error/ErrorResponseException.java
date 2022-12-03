package com.activepieces.common.error;


public interface ErrorResponseException {

    ErrorCode getErrorCode();
    String getMessage();

}

package com.activepieces.authentication.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class EmailExists extends Exception implements ErrorResponseException {


    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.EMAIL_EXISTS;
    }

}

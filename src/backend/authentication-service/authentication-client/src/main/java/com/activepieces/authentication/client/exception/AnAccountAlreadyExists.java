package com.activepieces.authentication.client.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

public class AnAccountAlreadyExists extends Exception implements ErrorResponseException {


    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.AN_ACCOUNT_ALREADY_EXISTS;
    }

}

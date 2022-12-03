package com.activepieces.variable.model.exception;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;
import lombok.Getter;

import java.util.List;

@Getter
public class MissingConfigsException extends Exception implements ErrorResponseException {

    private final List<String> configs;

    public MissingConfigsException(final List<String> configs){
        super(String.format("The following variables=%s is required", String.join(",", configs)));
        this.configs = configs;
    }

    public MissingConfigsException(MissingConfigsException missingConfigsException, String actionName){
        super(String.format("The following configs=%s is required for actionName=%s", String.join(",", missingConfigsException.getConfigs()), actionName));
        this.configs = missingConfigsException.getConfigs();
    }
    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.MISSING_CONFIGS;
    }
}

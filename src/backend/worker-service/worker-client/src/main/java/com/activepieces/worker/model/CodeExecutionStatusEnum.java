package com.activepieces.worker.model;

import java.util.Objects;

public enum CodeExecutionStatusEnum {
    OK("OK"),
    RUNTIME_ERROR("Runtime error"),
    CRASHED("Program crashed"),
    TIMEOUT("Timeout"),
    INTERNAL_ERROR("Internal Error"),
    UNKNOWN_ERROR("Unknown Error"),
    INVALID_ARTIFACT("Invalid Artifact");

    private final String message;

    CodeExecutionStatusEnum(String message){
        this.message = message;
    }

    public String getMessage(){
        return message;
    }

    public static CodeExecutionStatusEnum fromStatus(String status){
        if(Objects.isNull(status)){
            return OK;
        }
        switch (status){
            case "XX":
                return INTERNAL_ERROR;
            case "TO":
                return TIMEOUT;
            case "RE":
                return RUNTIME_ERROR;
            case "SG":
                return CRASHED;
            default:
                return UNKNOWN_ERROR;
        }
    }
}

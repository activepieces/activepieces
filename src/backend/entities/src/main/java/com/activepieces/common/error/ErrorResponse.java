package com.activepieces.common.error;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.io.Serializable;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse implements Serializable {

    @JsonProperty
    private String message;

    @JsonProperty
    private ErrorCode errorCode;

    public ErrorResponse(ErrorResponseException errorResponse){
        this.message = errorResponse.getMessage();
        this.errorCode = errorResponse.getErrorCode();
    }
}

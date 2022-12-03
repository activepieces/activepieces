package com.activepieces.common.error;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {

    @JsonProperty
    private String message;

    @JsonProperty
    private ErrorCode errorCode;

    public ErrorResponse(ErrorResponseException errorResponse){
        this.message = errorResponse.getMessage();
        this.errorCode = errorResponse.getErrorCode();
    }
}

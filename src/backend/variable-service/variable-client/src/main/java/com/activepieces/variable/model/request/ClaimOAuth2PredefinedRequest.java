package com.activepieces.variable.model.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

import javax.validation.constraints.NotNull;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
public class ClaimOAuth2PredefinedRequest {

    @JsonProperty
    @NotNull
    private String componentName;

    @JsonProperty
    @URL(regexp = "^(http|https).*")
    private String tokenUrl;

    @JsonProperty
    @NotNull
    private String code;

}

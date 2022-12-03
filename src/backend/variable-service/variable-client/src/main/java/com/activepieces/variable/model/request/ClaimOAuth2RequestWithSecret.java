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
public class ClaimOAuth2RequestWithSecret {

    @JsonProperty
    @NotNull
    private String code;

    @JsonProperty
    @URL(regexp = "^(http|https).*")
    private String tokenUrl;

    @JsonProperty
    @NotNull
    private String clientId;

    @JsonProperty
    @NotNull
    private String clientSecret;
}

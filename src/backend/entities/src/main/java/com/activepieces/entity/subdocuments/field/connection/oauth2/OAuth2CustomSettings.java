package com.activepieces.entity.subdocuments.field.connection.oauth2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@Getter
@Setter
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
public class OAuth2CustomSettings extends OAuth2Settings{

    @JsonProperty
    @NotNull
    private String scope;

    @JsonProperty
    @NotNull
    @NotEmpty
    private String clientId;

    @JsonProperty
    @NotNull
    @NotEmpty
    private String clientSecret;

    @JsonProperty
    @NotNull
    @NotEmpty
    private String authUrl;

    @JsonProperty
    @NotNull
    @NotEmpty
    private String tokenUrl;

    @JsonProperty
    @NotNull
    @NotEmpty
    private String redirectUrl;

    @JsonProperty
    private String refreshUrl;

}


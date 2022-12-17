package com.activepieces.entity.subdocuments.field.connection.oauth2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@Getter
@Setter
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
public class OAuth2PredefinedSettings extends OAuth2Settings{

    @JsonProperty
    @NotNull
    private String scope;

    @JsonProperty
    @NotNull
    @NotEmpty
    private String authUrl;

    @JsonProperty
    @NotNull
    @NotEmpty
    private String tokenUrl;

    @JsonProperty
    private String refreshUrl;

}


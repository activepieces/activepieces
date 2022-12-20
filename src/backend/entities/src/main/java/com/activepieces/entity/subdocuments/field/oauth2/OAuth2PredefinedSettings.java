package com.activepieces.entity.subdocuments.field.oauth2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

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

}


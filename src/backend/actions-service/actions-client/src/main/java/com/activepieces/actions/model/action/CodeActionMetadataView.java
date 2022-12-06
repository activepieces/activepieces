package com.activepieces.actions.model.action;

import com.activepieces.actions.model.action.settings.CodeSettingsView;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

@Getter
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class CodeActionMetadataView extends ActionMetadataView  {

    @JsonProperty
    @NotNull
    @Valid
    private CodeSettingsView settings;

}

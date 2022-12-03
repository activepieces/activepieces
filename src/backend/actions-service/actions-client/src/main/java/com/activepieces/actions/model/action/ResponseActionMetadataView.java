package com.activepieces.actions.model.action;

import com.activepieces.entity.subdocuments.action.settings.ResponseSettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
public class ResponseActionMetadataView extends ActionMetadataView {

    @JsonProperty
    @Valid
    private ResponseSettings settings;


}

package com.activepieces.actions.model.action;

import com.activepieces.actions.model.action.settings.LoopOnItemsActionSettingsView;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;

@Getter
@Setter
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class LoopOnItemsActionMetadataView extends ActionMetadataView {

    @JsonProperty
    @Valid
    private ActionMetadataView firstLoopAction;

    @JsonProperty
    @Valid
    private LoopOnItemsActionSettingsView settings;

}

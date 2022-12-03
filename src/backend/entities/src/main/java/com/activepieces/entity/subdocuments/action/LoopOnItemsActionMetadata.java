package com.activepieces.entity.subdocuments.action;

import com.activepieces.entity.subdocuments.action.settings.LoopOnItemsActionSettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class LoopOnItemsActionMetadata extends ActionMetadata {

    @JsonProperty
    private ActionMetadata firstLoopAction;

    @JsonProperty
    private LoopOnItemsActionSettings settings;

}

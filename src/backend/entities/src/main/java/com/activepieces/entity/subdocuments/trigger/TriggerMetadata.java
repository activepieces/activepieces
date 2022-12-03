package com.activepieces.entity.subdocuments.trigger;

import com.activepieces.entity.subdocuments.action.ActionMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
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
public abstract class TriggerMetadata {

    @JsonProperty
    private String displayName;

    @JsonProperty
    private String name;

    @JsonProperty
    private boolean valid;

    @JsonProperty
    private ActionMetadata nextAction;

}
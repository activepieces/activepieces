package com.activepieces.entity.subdocuments.action;

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
public abstract class ActionMetadata {

    @JsonProperty
    private String displayName;

    @JsonProperty
    private String name;

    @JsonProperty
    private ActionMetadata nextAction;

    @JsonProperty
    private boolean valid;

}

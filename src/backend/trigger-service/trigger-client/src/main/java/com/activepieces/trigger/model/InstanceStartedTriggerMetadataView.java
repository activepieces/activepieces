package com.activepieces.trigger.model;

import com.activepieces.entity.subdocuments.trigger.settings.EmptySettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
public class InstanceStartedTriggerMetadataView extends TriggerMetadataView {

    @JsonProperty
    @Valid
    @NotNull
    private EmptySettings settings;

}
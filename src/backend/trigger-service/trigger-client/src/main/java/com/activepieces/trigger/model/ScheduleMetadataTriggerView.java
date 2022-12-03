package com.activepieces.trigger.model;

import com.activepieces.entity.subdocuments.trigger.settings.ScheduleTriggerSettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@SuperBuilder(toBuilder = true)
public class ScheduleMetadataTriggerView extends TriggerMetadataView {

    @JsonProperty
    @Valid
    @NotNull
    private ScheduleTriggerSettings settings;

}
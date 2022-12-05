package com.activepieces.entity.subdocuments.trigger;

import com.activepieces.entity.subdocuments.trigger.settings.ScheduleTriggerSettings;
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
public class ScheduleTriggerMetadata extends TriggerMetadata {

    @JsonProperty
    private ScheduleTriggerSettings settings;

}

package com.activepieces.entity.subdocuments.trigger.settings;

import com.activepieces.common.validation.constraints.CronExpression;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class ScheduleTriggerSettings {

    @JsonProperty
    @NotEmpty
    @CronExpression
    private String cronExpression;
}

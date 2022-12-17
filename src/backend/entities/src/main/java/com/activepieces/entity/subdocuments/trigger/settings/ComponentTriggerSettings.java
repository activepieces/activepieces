package com.activepieces.entity.subdocuments.trigger.settings;

import com.activepieces.common.validation.CronExpression;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class ComponentTriggerSettings {

    @JsonProperty
    @NotEmpty
    private String componentName;

    @JsonProperty

    private String triggerName;

    @JsonProperty
    @NotNull
    private Map<String, Object> input;

}

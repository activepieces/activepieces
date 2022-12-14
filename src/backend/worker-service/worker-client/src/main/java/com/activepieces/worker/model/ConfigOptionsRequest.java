package com.activepieces.worker.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class ConfigOptionsRequest {

    @JsonProperty
    @NotNull
    private String configName;

    @NotNull
    @JsonProperty
    private String actionName;

    @NotNull
    @JsonProperty
    private Map<String, Object> config;
}

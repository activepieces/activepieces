package com.activepieces.entity.subdocuments.action.settings;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class ComponentSettings {

    private String artifact;

    private String artifactUrl;

    private ComponentInput input;

    private String componentName;

    private String componentVersion;

    private String actionName;

}

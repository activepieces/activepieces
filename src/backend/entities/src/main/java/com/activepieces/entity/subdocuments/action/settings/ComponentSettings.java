package com.activepieces.entity.subdocuments.action.settings;

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
public class ComponentSettings {

    private String artifact;

    private String artifactUrl;

    private ComponentInput input;

    private String componentName;

    private String componentVersion;

    private String actionName;

}

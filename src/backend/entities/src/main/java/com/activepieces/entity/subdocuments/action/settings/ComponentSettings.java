package com.activepieces.entity.subdocuments.action.settings;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class ComponentSettings {

    private Map<String, Object> input;

    private String componentName;

    private String actionName;

}

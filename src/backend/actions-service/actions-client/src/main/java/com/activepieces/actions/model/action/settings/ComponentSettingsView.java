package com.activepieces.actions.model.action.settings;

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
public class ComponentSettingsView {

  @NotNull @JsonProperty @Valid private Map<String, Object> input;

  @JsonProperty @NotNull private String componentName;

  @JsonProperty @NotNull private String actionName;

}

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
public class CodeSettings {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private String artifact;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private String artifactUrl;

  @NotNull @JsonProperty @Valid private Map<String, Object> input;

}

package com.activepieces.actions.model.action.settings;

import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.utils.ManifestUtils;
import com.activepieces.entity.subdocuments.action.settings.ComponentInput;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class ComponentSettingsView {



  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private String artifact;

  @JsonIgnore private ArtifactFile newArtifactToUploadFile;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private String artifactUrl;

  @NotNull @JsonProperty @Valid private ComponentInput input;

  @JsonProperty @NotNull private String componentName;

  @JsonProperty @NotNull private String componentVersion;

  @JsonProperty @NotNull private String actionName;

  @JsonProperty
  public String getManifestUrl() {
    return ManifestUtils.getManifestUrl(componentName, componentVersion);
  }

  @JsonIgnore
  public String getTemplateName() {
    return String.format("%s@%s:%s", getComponentName(), getComponentVersion(), actionName);
  }
}

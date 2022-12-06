package com.activepieces.actions.model.action.settings;

import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.code.ArtifactMetadataSettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
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
public class CodeSettingsView implements ArtifactMetadataSettings {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private Ksuid artifactSourceId;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private Ksuid artifactPackagedId;

  @JsonProperty
  private ArtifactFile newArtifactToUploadFile;

  @NotNull @JsonProperty @Valid private Map<String, Object> input;

}

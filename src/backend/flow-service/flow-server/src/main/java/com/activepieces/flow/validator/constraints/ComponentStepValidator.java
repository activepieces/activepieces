package com.activepieces.flow.validator.constraints;

import com.activepieces.action.component.ComponentService;
import com.activepieces.actions.model.action.ComponentActionMetadataView;
import com.activepieces.actions.model.action.settings.ComponentSettingsView;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.flow.validator.FlowVersionRequestBuilder;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

@AllArgsConstructor
public class ComponentStepValidator implements FlowVersionRequestBuilder {

  private final ComponentService componentService;

  @Override
  public FlowVersionView construct(
          Ksuid projectId,
          Ksuid collectionId,
      FlowVersionView flowVersion,
      List<ArtifactFile> artifactFileList,
      FlowVersionView currentVersion)
      throws Exception {
    List<ComponentActionMetadataView> componentActions =
        FlowVersionUtil.findComponentActions(flowVersion);
    for (ComponentActionMetadataView action : componentActions) {
      ComponentSettingsView componentSettingsView = action.getSettings();
      if (!action.isValid()) {
        continue;
      }
      componentSettingsView.setArtifact(componentSettingsView.getTemplateName());
      final String currentVersionName =
          getTemplateNameFromCurrentVersion(currentVersion, action.getName());
      if (Objects.equals(componentSettingsView.getTemplateName(), currentVersionName)) {
        continue;
      }
      ArtifactFile.ArtifactFileBuilder artifactFileBuilder =
          ArtifactFile.builder()
              .inputStream(componentService.generateCode(componentSettingsView))
              .hashWithExtension(componentSettingsView.getTemplateName());
      componentSettingsView.setNewArtifactToUploadFile(artifactFileBuilder.build());
    }
    return flowVersion;
  }

  private String getTemplateNameFromCurrentVersion(
      FlowVersionView currentVersion, String stepName) {
    if (Objects.isNull(currentVersion)) {
      return null;
    }
    return FlowVersionUtil.findComponentActions(currentVersion).stream()
        .filter(f -> f.getName().equals(stepName))
        .map(
            f -> {
              if (Objects.isNull(f.getSettings())) {
                return null;
              }
              return f.getSettings().getArtifact();
            })
        // We need to map it to Optional ofNullable otherwise findFirst will return an error,
        // because an optional can't accept null value.
        .map(Optional::ofNullable)
        .findFirst()
        .flatMap(Function.identity())
        .orElse(null);
  }
}

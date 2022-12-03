package com.activepieces.flow.validator.constraints;

import com.activepieces.actions.model.action.CodeActionMetadataView;
import com.activepieces.actions.model.action.settings.CodeSettingsView;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponse;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.flow.validator.FlowVersionRequestBuilder;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import org.apache.commons.io.FilenameUtils;

import java.util.*;

@AllArgsConstructor
public class CodeArtifactsValidator implements FlowVersionRequestBuilder {

  @Override
  public FlowVersionView construct(
      Ksuid projectId,
      Ksuid collectionId,
      FlowVersionView flowVersion,
      List<ArtifactFile> artifactFileList,
      FlowVersionView currentVersion) {
    List<CodeActionMetadataView> codeActions =
        FlowVersionUtil.findCodeActions(flowVersion);
    Set<ErrorResponse> errorResponses = flowVersion.getErrors();
    for (CodeActionMetadataView codeAction : codeActions) {
      if (Objects.isNull(codeAction.getSettings())) {
        continue;
      }
      CodeSettingsView codeSettings = codeAction.getSettings();
      codeSettings.setArtifact(getArtifactFromCurrentVersion(currentVersion, codeAction.getName()));
      Optional<ArtifactFile> file =
          artifactFileList.stream()
              .filter(
                  f ->
                      Objects.equals(
                          FilenameUtils.removeExtension(f.getOriginalFileName()),
                          codeAction.getName()))
              .findFirst();
      if (file.isPresent()) {
        codeSettings.setNewArtifactToUploadFile(file.get());
        continue;
      }
      if (Objects.nonNull(codeSettings.getArtifact())) {
        continue;
      }
      errorResponses.add(
          new ErrorResponse(
              String.format("Missing artifact for action name=%s", codeAction.getName()),
              ErrorCode.MISSING_CODE_ARTIFACTS));
      codeAction.setValid(false);
    }
    return flowVersion.toBuilder().errors(errorResponses).build();
  }

  private String getArtifactFromCurrentVersion(FlowVersionView currentVersion, String stepName) {
    if (Objects.isNull(currentVersion)) {
      return null;
    }
    Optional<CodeActionMetadataView> codeActionViewMetadataView =
        FlowVersionUtil.findCodeActions(currentVersion).stream()
            .filter(f -> f.getName().equals(stepName))
            .findFirst();
    if (codeActionViewMetadataView.isEmpty()) {
      return null;
    }
    CodeSettingsView codeSettings = codeActionViewMetadataView.get().getSettings();
    if (Objects.isNull(codeSettings)) {
      return null;
    }
    return codeSettings.getArtifact();
  }
}

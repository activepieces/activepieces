package com.activepieces.flow.validator.constraints;

import com.activepieces.actions.model.action.ActionMetadataView;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.flow.validator.FlowVersionRequestBuilder;
import com.activepieces.trigger.model.EmptyTriggerMetadataView;
import com.activepieces.trigger.model.TriggerMetadataView;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;

import javax.validation.Validator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@AllArgsConstructor
public class StepsValidator implements FlowVersionRequestBuilder {

  private final Validator validator;

  @Override
  public FlowVersionView construct(
          Ksuid projectId,
          Ksuid collectionId,
          FlowVersionView flowVersion, List<ArtifactFile> artifactFileList, FlowVersionView draftVersion) {
    if (Objects.isNull(flowVersion.getTrigger())) {
      return flowVersion;
    }
    TriggerMetadataView triggerMetadata = flowVersion.getTrigger();
    triggerMetadata.setValid(
        validator.validate(triggerMetadata).size() == 0
            && !(triggerMetadata instanceof EmptyTriggerMetadataView));
    List<ActionMetadataView> actionMetadataViewList = FlowVersionUtil.findAllActions(flowVersion);
    for (ActionMetadataView actionMetadataView : actionMetadataViewList) {
      actionMetadataView.setValid(validator.validate(actionMetadataView).size() == 0);
    }
    return flowVersion;
  }
}

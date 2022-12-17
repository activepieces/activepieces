package com.activepieces.flow.validator.constraints;

import com.activepieces.actions.model.action.ActionMetadataView;
import com.activepieces.actions.model.action.ComponentActionMetadataView;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.component.ComponentService;
import com.activepieces.entity.subdocuments.action.settings.ComponentSettings;
import com.activepieces.entity.subdocuments.trigger.settings.ComponentTriggerSettings;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.flow.validator.FlowVersionRequestBuilder;
import com.activepieces.trigger.model.ComponentTriggerMetadataView;
import com.activepieces.trigger.model.EmptyTriggerMetadataView;
import com.activepieces.trigger.model.TriggerMetadataView;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;

import javax.validation.Validator;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@AllArgsConstructor
public class StepsValidator implements FlowVersionRequestBuilder {

  private final Validator validator;
  private final ComponentService componentService;

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
    if (triggerMetadata instanceof ComponentTriggerMetadataView) {
      final ComponentTriggerMetadataView componentTrigger = (ComponentTriggerMetadataView) triggerMetadata;
      triggerMetadata.setValid(triggerMetadata.isValid() && componentService.validateConfig(componentTrigger.getSettings().getComponentName(),
              null, componentTrigger.getSettings().getTriggerName(), componentTrigger.getSettings().getInput()));
    }
    List<ActionMetadataView> actionMetadataViewList = FlowVersionUtil.findAllActions(flowVersion);
    for (ActionMetadataView actionMetadataView : actionMetadataViewList) {
      actionMetadataView.setValid(validator.validate(actionMetadataView).size() == 0);
      if (actionMetadataView instanceof ComponentActionMetadataView) {
        final ComponentActionMetadataView componentAction = (ComponentActionMetadataView) actionMetadataView;
        actionMetadataView.setValid(actionMetadataView.isValid()
                && componentService.validateConfig(componentAction.getSettings().getComponentName(),
                componentAction.getSettings().getActionName(), null, componentAction.getSettings().getInput()));
      }
    }
    return flowVersion;
  }
}

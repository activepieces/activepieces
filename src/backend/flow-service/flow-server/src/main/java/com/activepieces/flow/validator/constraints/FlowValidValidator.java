package com.activepieces.flow.validator.constraints;

import com.activepieces.actions.model.action.ActionMetadataView;
import com.activepieces.common.model.ArtifactFile;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.flow.validator.FlowVersionRequestBuilder;
import com.github.ksuid.Ksuid;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class FlowValidValidator implements FlowVersionRequestBuilder {

  @Override
  public FlowVersionView construct(
          Ksuid projectId,
      Ksuid collectionId,
      FlowVersionView flowVersion,
      List<ArtifactFile> artifactFileList,
      FlowVersionView draftVersion) {
    List<Boolean> actionsValidity =
        FlowVersionUtil.findAllActions(flowVersion).stream()
            .map(ActionMetadataView::isValid)
            .collect(Collectors.toList());
    boolean valid = flowVersion.getErrors().size() == 0;
    for (boolean actionValid : actionsValidity) {
      valid = valid && actionValid;
    }
    if(Objects.nonNull(flowVersion.getTrigger())){
      valid = valid && flowVersion.getTrigger().isValid();
    }
    return flowVersion.toBuilder().valid(valid).build();
  }
}

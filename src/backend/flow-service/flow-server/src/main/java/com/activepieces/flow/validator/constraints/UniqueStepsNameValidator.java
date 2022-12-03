package com.activepieces.flow.validator.constraints;

import com.activepieces.actions.model.action.ActionMetadataView;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponse;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.flow.validator.FlowVersionRequestBuilder;
import com.github.ksuid.Ksuid;
import org.apache.commons.lang.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

public class UniqueStepsNameValidator implements FlowVersionRequestBuilder {

  @Override
  public FlowVersionView construct(
          Ksuid projectId,
          Ksuid collectionId,
      FlowVersionView flowVersion,
      List<ArtifactFile> artifactFileList,
      FlowVersionView draftVersion) {
    List<String> actionNames =
        FlowVersionUtil.findAllActions(flowVersion).stream()
            .map(ActionMetadataView::getName)
            .collect(Collectors.toList());
    if (Objects.nonNull(flowVersion.getTrigger())) {
      actionNames.add(flowVersion.getTrigger().getName());
    }
    Set<String> uniqueCenters = new HashSet<>(actionNames);
    Set<ErrorResponse> errorResponses = flowVersion.getErrors();
    uniqueCenters.remove(null);
    if (uniqueCenters.size() != actionNames.size()) {
      errorResponses.add(
          new ErrorResponse(
              String.format(
                  "Actions names are not unique %s", StringUtils.join(uniqueCenters, ',')),
              ErrorCode.DUPLICATED_STEP_NAME));
    }
    return flowVersion.toBuilder().errors(errorResponses).build();
  }
}

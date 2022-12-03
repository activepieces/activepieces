package com.activepieces.flow.controller;

import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionMetaView;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@Hidden
@RequestMapping
public class FlowVersionController {

  private final FlowVersionService flowVersionService;

  @Autowired
  public FlowVersionController(
      @NonNull final FlowVersionService flowVersionService) {
    this.flowVersionService = flowVersionService;
  }

  @GetMapping("/flows/versions/{versionId}")
  public ResponseEntity<FlowVersionView> get(
      @PathVariable("versionId") UUID versionId)
          throws PermissionDeniedException, FlowVersionNotFoundException {
    FlowVersionView versionView = flowVersionService.get(versionId);
    return ResponseEntity.ok(versionView);
  }

  @GetMapping("/flows/{flowId}/versions")
  public ResponseEntity<List<FlowVersionMetaView>> list(
          @PathVariable("flowId") UUID flowId)
          throws PermissionDeniedException, FlowVersionNotFoundException {
    return ResponseEntity.ok(flowVersionService.listByFlowId(flowId));
  }


}

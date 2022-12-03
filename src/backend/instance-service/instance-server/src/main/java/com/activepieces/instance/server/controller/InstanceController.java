package com.activepieces.instance.server.controller;

import com.activepieces.action.FlowPublisherService;
import com.activepieces.common.error.exception.flow.FlowExecutionInternalError;
import com.activepieces.common.identity.PrincipleType;
import com.activepieces.common.identity.PrincipleIdentity;
import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.entity.enums.EditState;
import com.activepieces.flow.FlowService;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.instance.client.InstanceService;
import com.activepieces.instance.client.model.CreateOrUpdateInstanceRequest;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.trigger.model.WebhookTriggerMetadataView;
import com.activepieces.variable.model.exception.MissingConfigsException;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.*;

@RestController
@Hidden
@RequestMapping
public class InstanceController {

  private final InstanceService instanceService;
  private final FlowService flowService;
  private final FlowVersionService flowVersionService;
  private final FlowPublisherService flowPublisherService;
  private final CollectionVersionService collectionVersionService;

  @Autowired
  public InstanceController(
      @NonNull FlowPublisherService flowPublisherService,
      @NonNull final InstanceService instanceService,
      @NonNull final FlowVersionService flowVersionService,
      @NonNull final FlowService flowService,
      @NonNull final CollectionVersionService collectionVersionService) {
    this.instanceService = instanceService;
    this.flowVersionService = flowVersionService;
    this.flowPublisherService = flowPublisherService;
    this.flowService = flowService;
    this.collectionVersionService = collectionVersionService;
  }

  @GetMapping("/instances/{instanceId}")
  public ResponseEntity<InstanceView> get(@PathVariable("instanceId") UUID instanceId)
      throws PermissionDeniedException, InstanceNotFoundException {
    return ResponseEntity.ok(instanceService.get(instanceId));
  }

  @GetMapping("/projects/{projectId}/instances")
  public ResponseEntity<SeekPage<InstanceView>> listByEnvironmentId(
      @PathVariable("projectId") UUID projectId,
      @RequestParam(value = "startingAfter", required = false) UUID startingAfter,
      @RequestParam(value = "limit", defaultValue = "10", required = false) int limit)
      throws InstanceNotFoundException, PermissionDeniedException {
    return ResponseEntity.ok(
        instanceService.listByProjectId(projectId, new SeekPageRequest(startingAfter, null, limit)));
  }

  @PostMapping("/instances")
  public ResponseEntity<InstanceView> create(
      @RequestBody @Valid CreateOrUpdateInstanceRequest request)
      throws PermissionDeniedException, ResourceNotFoundException, FlowVersionNotFoundException,
          CollectionVersionNotFoundException, MissingConfigsException {
    CollectionVersionView collectionVersionView =
        collectionVersionService.get(request.getCollectionVersionId());
    if (collectionVersionView.getState().equals(EditState.DRAFT)) {
      throw new IllegalArgumentException(
          String.format(
              "The Collection version %s is not published", collectionVersionView.getId()));
    }
    return ResponseEntity.ok(instanceService.create(request));
  }

  @PutMapping("/instances/{instanceId}")
  public ResponseEntity<InstanceView> update(
      @PathVariable("instanceId") UUID integrationId,
      @RequestBody @Valid CreateOrUpdateInstanceRequest request)
      throws PermissionDeniedException, InstanceNotFoundException, FlowNotFoundException,
          FlowVersionNotFoundException, MissingConfigsException,
          CollectionVersionNotFoundException {
    return ResponseEntity.ok(instanceService.update(integrationId, request));
  }

  @DeleteMapping("/instances/{instanceId}")
  public void delete(@PathVariable("instanceId") UUID instanceId)
      throws PermissionDeniedException, InstanceNotFoundException, ResourceNotFoundException,
          InterruptedException {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (Objects.isNull(authentication) || Objects.isNull(authentication.getPrincipal())) {
      throw new PermissionDeniedException(
          String.format(
              "Permission Denied No account found, cannot delete instance id %s", instanceId));
    }
    instanceService.delete(instanceId);
  }

  // TODO TRIGGER ALL INSTANCES
  @PostMapping({"/flows/{flowId}/runs"})
  public ResponseEntity<InstanceRunView> execute(
      @PathVariable("flowId") UUID flowId,
      @RequestBody @Valid Map<String, Object> payload)
          throws PermissionDeniedException, FlowNotFoundException,FlowExecutionInternalError, MissingConfigsException, ResourceNotFoundException {
    SecurityContextHolder.getContext().setAuthentication(null);
    FlowView flowView = flowService.get(flowId);
/*
    InstanceRunView manualFlowExecutionResponse =
        flowPublisherService.executeInstance(
            instanceView.getId(),
            flowVersionId.get(),
            Collections.emptyMap(),
                payload,
            true);*/
    return ResponseEntity.noContent().build();
  }
}

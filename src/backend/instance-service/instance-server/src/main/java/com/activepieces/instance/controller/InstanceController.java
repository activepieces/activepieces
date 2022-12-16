package com.activepieces.instance.controller;
import com.activepieces.action.FlowPublisherService;
import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.collection.*;
import com.activepieces.common.error.exception.flow.FlowExecutionInternalError;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.flow.FlowService;
import com.activepieces.flow.model.FlowView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.instance.client.InstanceService;
import com.activepieces.instance.client.model.CreateOrUpdateInstanceRequest;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.variable.model.exception.MissingConfigsException;
import com.github.ksuid.Ksuid;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    private final FlowPublisherService publisherService;

    @Autowired
    public InstanceController(@NonNull final InstanceService instanceService,
                              @NonNull final FlowPublisherService publisherService,
                              @NonNull final FlowService flowService) {
        this.instanceService = instanceService;
        this.flowService = flowService;
        this.publisherService = publisherService;
    }

    @GetMapping("/instance/{instanceId}")
    public ResponseEntity<InstanceView> get(@PathVariable("instanceId") Ksuid instanceId)
            throws PermissionDeniedException, InstanceNotFoundException {
        return ResponseEntity.ok(instanceService.get(instanceId));
    }

    @GetMapping("/collections/{collectionId}/instance")
    public ResponseEntity<InstanceView> listByEnvironmentId(
            @PathVariable("collectionId") Ksuid collectionId)
            throws  PermissionDeniedException, CollectionInstanceNotFoundException {
        return ResponseEntity.ok(instanceService.getByCollectionId(collectionId));
    }

    @PostMapping("/collections/{collectionId}/instance")
    public ResponseEntity<InstanceView> create(@PathVariable("collectionId") Ksuid collectionId, @RequestBody CreateOrUpdateInstanceRequest request)
            throws PermissionDeniedException, ResourceNotFoundException, FlowVersionNotFoundException,
            CollectionVersionNotFoundException, MissingConfigsException, CollectionNotFoundException, FlowNotFoundException, CollectionInvalidStateException, CollectionVersionAlreadyLockedException {

        return ResponseEntity.ok(instanceService.create(collectionId, request));
    }
        @DeleteMapping("/instance/{instanceId}")
    public void delete(@PathVariable("instanceId") Ksuid instanceId)
            throws PermissionDeniedException, InstanceNotFoundException, ResourceNotFoundException,
            InterruptedException {
        instanceService.delete(instanceId);
    }

    @PostMapping({"/flows/{flowId}/webhook"})
    public ResponseEntity<InstanceRunView> execute(
            @PathVariable("flowId") Ksuid flowId,
            @RequestBody @Valid Map<String, Object> payload)
            throws PermissionDeniedException, FlowNotFoundException, FlowExecutionInternalError, MissingConfigsException, ResourceNotFoundException, InstanceNotFoundException {
        SecurityContextHolder.getContext().setAuthentication(null);
        final FlowView flowView = flowService.get(flowId);
        final SeekPage<InstanceView> instanceViewSeekPage = instanceService.listByCollectionId(flowView.getCollectionId(), new SeekPageRequest(null, 1));
        if (instanceViewSeekPage.getData().isEmpty()) {
            throw new InstanceNotFoundException(flowId);
        }
        final InstanceView instanceView = instanceViewSeekPage.getData().get(0);
        publisherService.executeInstance(
                        instanceView.getId(),
                        instanceView.getFlowVersionId().get(flowId),
                        payload);
        return ResponseEntity.noContent().build();
    }
}

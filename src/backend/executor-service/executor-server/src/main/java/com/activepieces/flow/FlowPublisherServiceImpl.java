package com.activepieces.flow;

import com.activepieces.action.ExecutionRequest;
import com.activepieces.action.FlowPublisherService;
import com.activepieces.actions.store.model.StorePath;
import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.flow.FlowExecutionInternalError;
import com.activepieces.entity.enums.FlowExecutionStatus;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.subdocuments.runs.ActionExecutionStatus;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.activepieces.entity.subdocuments.runs.StepOutput;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.instance.client.InstanceService;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.trigger.model.TriggerMetadataView;
import com.activepieces.variable.model.VariableService;
import com.activepieces.worker.service.WorkerService;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Service
@Log4j2
public class FlowPublisherServiceImpl implements FlowPublisherService {


    private final InstanceService instanceService;
    private final FlowVersionService flowVersionService;
    private final WorkerService workerService;
    private final CollectionVersionService collectionVersionService;
    private final InstanceRunService instanceRunService;
    private final VariableService variableService;
    private final FlowScheduler flowScheduler;
    private final PermissionService permissionService;

    @Autowired
    FlowPublisherServiceImpl(
            @NonNull final FlowVersionService flowVersionService,
            @NonNull final WorkerService workerService,
            @NonNull final PermissionService permissionService,
            @NonNull final InstanceService instanceService,
            @NonNull final FlowScheduler flowScheduler,
            @NonNull final InstanceRunService instanceRunService,
            @NonNull final VariableService variableService,
            @NonNull final CollectionVersionService collectionVersionService) {
        this.collectionVersionService = collectionVersionService;
        this.instanceService = instanceService;
        this.flowScheduler = flowScheduler;
        this.variableService = variableService;
        this.workerService = workerService;
        this.permissionService = permissionService;
        this.instanceRunService = instanceRunService;
        this.flowVersionService = flowVersionService;
    }

    @Override
    public InstanceRunView executeTest(
            @NonNull Ksuid collectionVersionId,
            @NonNull Ksuid flowVersionId,
            @NonNull Map<String, Object> triggerPayload)
            throws FlowExecutionInternalError {
        try {
            FlowVersionView flowVersionView = flowVersionService.get(flowVersionId);
            CollectionVersionView collectionVersionView =
                    collectionVersionService.get(collectionVersionId);
            Map<String, Object> validatedInstanceConfigs =
                    variableService.flatConfigsValue(collectionVersionView.getConfigs());
            Ksuid runId = Ksuid.newKsuid();
            Optional<ExecutionRequest> request =
                    constructRun(
                            runId,
                            StorePath.testScope(collectionVersionId),
                            null,
                            collectionVersionView,
                            flowVersionView,
                            validatedInstanceConfigs,
                            triggerPayload);
            if (request.isPresent()) {
                Ksuid projectID = permissionService.getFirstResourceParentWithType(collectionVersionView.getCollectionId(), ResourceType.PROJECT).getResourceId();
                InstanceRunView instanceRunView =
                        createInstanceRun(projectID, null, collectionVersionView, flowVersionView, request.get());
                flowScheduler.executeFlowAsync(request.get());
                return instanceRunView.toBuilder().build();
            }
            return InstanceRunView.builder().id(runId).build();
        } catch (Exception e) {
            e.printStackTrace();
            throw new FlowExecutionInternalError(e);
        }
    }

    @Override
    public InstanceRunView executeInstance(
            @NonNull Ksuid instanceId,
            @NonNull Ksuid flowVersionId,
            @NonNull Map<String, Object> triggerPayload,
            boolean async)
            throws FlowExecutionInternalError {
        try {
            InstanceView instanceView = instanceService.get(instanceId);
            CollectionVersionView collectionVersionView =
                    collectionVersionService.get(instanceView.getCollectionVersionId());
            FlowVersionView flowVersionView = flowVersionService.get(flowVersionId);
            Ksuid runId = Ksuid.newKsuid();
            Map<String, Object> validatedInstanceConfigs =
                    variableService.flatConfigsValue(collectionVersionView.getConfigs());
            Optional<ExecutionRequest> request =
                    constructRun(
                            runId,
                            StorePath.builder().build(),
                            instanceView,
                            collectionVersionView,
                            flowVersionView,
                            validatedInstanceConfigs,
                            triggerPayload);
            if (request.isPresent()) {
                InstanceRunView firstInstanceRun =
                        createInstanceRun(instanceView.getProjectId(), instanceId, collectionVersionView, flowVersionView, request.get());
                if (async) {
                    flowScheduler.executeFlowAsync(request.get());
                    return firstInstanceRun.toBuilder().build();
                } else {
                    InstanceRunView result =
                            workerService.executeFlow(
                                    firstInstanceRun,
                                    collectionVersionView,
                                    flowVersionView,
                                    request.get().getConfigs(),
                                    request.get().getTriggerPayload(),
                                    request.get().getStorePath());
                    return result.toBuilder().build();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new FlowExecutionInternalError(e);
        }
        return null;
    }


    private Optional<ExecutionRequest> constructRun(
            Ksuid runId,
            StorePath storePath,
            InstanceView instanceView,
            @NonNull CollectionVersionView collectionVersionView,
            @NonNull FlowVersionView version,
            @NonNull Map<String, Object> variables,
            @NonNull Map<String, Object> triggerPayload) {
        TriggerMetadataView trigger = version.getTrigger();
        if (Objects.nonNull(trigger)) {
            Ksuid instanceId = Objects.nonNull(instanceView) ? instanceView.getId() : null;
            ExecutionRequest request =
                    ExecutionRequest.builder()
                            .storePath(storePath)
                            .configs(variables)
                            .collectionVersionId(collectionVersionView.getId())
                            .triggerPayload(triggerPayload)
                            .instanceId(instanceId)
                            .flowVersionId(version.getId())
                            .runId(runId)
                            .build();
            return Optional.of(request);
        }
        return Optional.empty();
    }

    private InstanceRunView createInstanceRun(
            @NonNull final Ksuid projectId,
            final Ksuid instanceId,
            @NonNull CollectionVersionView collectionVersionView,
            @NonNull FlowVersionView flowVersion,
            ExecutionRequest executionRequest)
            throws PermissionDeniedException, InstanceNotFoundException, ResourceNotFoundException, IOException {
        final StepOutput triggerOutput = StepOutput.builder().output(executionRequest.getTriggerPayload()).status(ActionExecutionStatus.SUCCEEDED).build();
        final LinkedHashMap<String, StepOutput> steps = new LinkedHashMap<>();
        steps.put(flowVersion.getTrigger().getName(), triggerOutput);

        ExecutionStateView environmentView =
                ExecutionStateView.builder().configs(executionRequest.getConfigs())
                        .steps(steps)
                        .build();
        InstanceRunView instanceRunView =
                InstanceRunView.builder()
                        .id(executionRequest.getRunId())
                        .instanceId(instanceId)
                        .collectionId(collectionVersionView.getId())
                        .flowDisplayName(flowVersion.getDisplayName())
                        .collectionVersionId(collectionVersionView.getId())
                        .collectionDisplayName(collectionVersionView.getDisplayName())
                        .projectId(projectId)
                        .flowVersionId(flowVersion.getId())
                        .startTime(Instant.now().toEpochMilli())
                        .finishTime(Instant.now().toEpochMilli())
                        .status(
                                Objects.isNull(flowVersion.getTrigger().getNextAction())
                                        ? FlowExecutionStatus.SUCCEEDED
                                        : FlowExecutionStatus.RUNNING)
                        .build();
        return instanceRunService.createOrUpdate(instanceRunView, environmentView);
    }

}

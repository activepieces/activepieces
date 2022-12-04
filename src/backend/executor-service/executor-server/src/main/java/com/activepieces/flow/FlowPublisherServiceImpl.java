package com.activepieces.flow;

import com.activepieces.action.ExecutionRequest;
import com.activepieces.action.FlowPublisherService;
import com.activepieces.actions.store.model.StorePath;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.flow.FlowExecutionInternalError;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Service
@Log4j2
public class FlowPublisherServiceImpl implements FlowPublisherService {

    private final ObjectMapper objectMapper;

    private final InstanceService instanceService;
    private final FlowVersionService flowVersionService;
    private final WorkerService workerService;
    private final CollectionVersionService collectionVersionService;
    private final InstanceRunService instanceRunService;
    private final VariableService variableService;
    private final ErrorServiceHandler errorServiceHandler;
    private final FlowService flowService;
    private final PermissionService permissionService;
    private final String apiPrefix;

    @Autowired
    FlowPublisherServiceImpl(
            @NonNull final FlowVersionService flowVersionService,
            @NonNull final WorkerService workerService,
            @NonNull final InstanceService instanceService,
            @NonNull final ErrorServiceHandler errorServiceHandler,
            @NonNull final InstanceRunService instanceRunService,
            @NonNull final PermissionService permissionService,
            @NonNull final FlowService flowService,
            @NonNull final VariableService variableService,
            @NonNull final CollectionVersionService collectionVersionService,
            final ObjectMapper objectMapper,
            @Value("${com.activepieces.api-prefix}") String apiPrefix)
            throws IOException {
        this.apiPrefix = apiPrefix;
        this.permissionService = permissionService;
        this.flowService = flowService;
        this.objectMapper = objectMapper;
        this.errorServiceHandler = errorServiceHandler;
        this.collectionVersionService = collectionVersionService;
        this.instanceService = instanceService;
        this.variableService = variableService;
        this.workerService = workerService;
        this.instanceRunService = instanceRunService;
        this.flowVersionService = flowVersionService;
    }

    @Override
    public InstanceRunView executeTest(
            @NonNull Ksuid collectionVersionId,
            @NonNull Ksuid flowVersionId,
            @NonNull Map<String, Object> variables,
            @NonNull Map<String, Object> triggerPayload)
            throws FlowExecutionInternalError, ResourceNotFoundException {
        Ksuid projectId = permissionService.getFirstResourceParentWithType(flowVersionId, ResourceType.PROJECT).getResourceId();
        try {
            FlowVersionView flowVersionView = flowVersionService.get(flowVersionId);
            CollectionVersionView collectionVersionView =
                    collectionVersionService.get(collectionVersionId);
            Ksuid runId = Ksuid.newKsuid();
            Optional<ExecutionRequest> request =
                    constructRun(
                            runId,
                            StorePath.testScope(collectionVersionId),
                            null,
                            collectionVersionView,
                            flowVersionView,
                            variables,
                            triggerPayload);
            if (request.isPresent()) {
                InstanceRunView instanceRunView =
                        createInstanceRun(null, collectionVersionView, flowVersionView, request.get());
                // TODO FIX
                // publish(request.get());
                return instanceRunView.toBuilder().stateUrl(null).build();
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
            @NonNull Map<String, Object> flowConfigs,
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
                            StorePath.instance(instanceId),
                            instanceView,
                            collectionVersionView,
                            flowVersionView,
                            validatedInstanceConfigs,
                            triggerPayload);
            if (request.isPresent()) {
                InstanceRunView firstInstanceRun =
                        createInstanceRun(instanceView, collectionVersionView, flowVersionView, request.get());
                if (async) {
                  // TODO FIX
                    //  publish(request.get());
                    return firstInstanceRun.toBuilder().stateUrl(null).build();
                } else {
                    InstanceRunView result =
                            workerService.executeFlow(
                                    firstInstanceRun,
                                    collectionVersionView,
                                    flowVersionView,
                                    request.get().getConfigs(),
                                    request.get().getContext(),
                                    request.get().getTriggerPayload(),
                                    request.get().getStorePath());
                    return result.toBuilder().stateUrl(null).build();
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
            @NonNull Map<String, Object> triggerPayload)
            throws PermissionDeniedException, FlowNotFoundException {
        TriggerMetadataView trigger = version.getTrigger();
        if (Objects.nonNull(trigger)) {
            Ksuid instanceId = Objects.nonNull(instanceView) ? instanceView.getId() : null;
            ExecutionRequest request =
                    ExecutionRequest.builder()
                            .storePath(storePath)
                            .configs(variables)
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
            final InstanceView instance,
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
                        .context(executionRequest.getContext())
                        .build();
        InstanceRunView instanceRunView =
                InstanceRunView.builder()
                        .id(executionRequest.getRunId())
                        .instanceId(Objects.isNull(instance) ? null : instance.getId())
                        .flowDisplayName(flowVersion.getDisplayName())
                        .collectionVersionId(collectionVersionView.getId())
                        .collectionDisplayName(collectionVersionView.getDisplayName())
                        .projectId(Objects.isNull(instance) ? null : instance.getProjectId())
                        .flowVersionId(flowVersion.getId())
                        .epochStartTime(Instant.now().toEpochMilli())
                        .status(
                                Objects.isNull(flowVersion.getTrigger().getNextAction())
                                        ? FlowExecutionStatus.SUCCEEDED
                                        : FlowExecutionStatus.RUNNING)
                        .build();
        return instanceRunService.createOrUpdate(instanceRunView, environmentView);
    }

}

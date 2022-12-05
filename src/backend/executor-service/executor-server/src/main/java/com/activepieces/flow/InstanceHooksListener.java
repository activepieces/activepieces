package com.activepieces.flow;

import com.activepieces.action.FlowPublisherService;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.error.exception.flow.FlowExecutionInternalError;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.instance.client.InstancePublisher;
import com.activepieces.instance.client.InstanceSubscriber;
import com.activepieces.instance.client.model.InstanceEventType;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.trigger.model.InstanceStartedTriggerMetadataView;
import com.activepieces.trigger.model.InstanceStoppedTriggerMetadataView;
import com.activepieces.variable.model.exception.MissingConfigsException;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Log4j2
public class InstanceHooksListener implements InstanceSubscriber {

    private final FlowVersionService flowVersionService;
    private final ErrorServiceHandler errorServiceHandler;
    private final FlowPublisherService flowPublisherService;
    private final CollectionVersionService collectionVersionService;

    @Autowired
    public InstanceHooksListener(
            @NonNull final FlowVersionService flowVersionService,
            @NonNull final InstancePublisher instancePublisher,
            @NonNull final CollectionVersionService collectionVersionService,
            @NonNull final FlowPublisherService flowPublisherService,
            @NonNull final ErrorServiceHandler errorServiceHandler) {
        instancePublisher.addSubscriber(this);
        this.flowVersionService = flowVersionService;
        this.collectionVersionService = collectionVersionService;
        this.flowPublisherService = flowPublisherService;
        this.errorServiceHandler = errorServiceHandler;
    }

    private List<FlowVersionView> filterFlows(List<Ksuid> flowVersionIds, Class<?> triggerType) {
        return flowVersionIds.stream()
                .map(
                        f -> {
                            try {
                                return flowVersionService.getOptional(f).orElseThrow();
                            } catch (PermissionDeniedException e) {
                                throw errorServiceHandler.createInternalError(e);
                            }
                        })
                .filter(f -> Objects.nonNull(f.getTrigger())
                        && triggerType.isInstance(f.getTrigger()))
                .collect(Collectors.toList());
    }

    public void runFlows(InstanceView instance, Class<?> triggerType) {
        try {
            List<FlowVersionView> flowVersions =
                    filterFlows(new ArrayList<>(instance.getFlowVersionId().values()), triggerType);
            for (FlowVersionView flowVersionView : flowVersions) {
                InstanceRunView instanceRunView = flowPublisherService.executeInstance(
                        instance.getId(),
                        flowVersionView.getId(),
                        Collections.emptyMap(),
                        true);
                log.info("Running instance hook with run Id {}", instanceRunView.getId().toString());
            }
        } catch (FlowExecutionInternalError | MissingConfigsException | ResourceNotFoundException e) {
            throw errorServiceHandler.createInternalError(e);
        }
    }

    public void onStop(InstanceView entity) {
        runFlows(entity, InstanceStoppedTriggerMetadataView.class);
    }

    public void onStart(InstanceView entity) {
        runFlows(entity, InstanceStartedTriggerMetadataView.class);
    }

    @Override
    public void onListen(InstanceEventType type, InstanceView entity) {
        log.info("Instance event type {} for Instance Id {}", type, entity.getId());
        switch (type) {
            case CREATE:
                onStart(entity);
                break;
            case DELETE:
                onStop(entity);
                break;
            case UPDATE:
                break;
            default:
                throw errorServiceHandler.createInternalError(
                        new RuntimeException("Unexpected instance event type " + type));
        }
    }
}

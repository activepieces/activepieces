package com.activepieces.flow;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.common.pagination.PageFilter;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.sql.Flow;
import com.activepieces.entity.sql.FlowVersion;
import com.activepieces.entity.sql.Instance;
import com.activepieces.flow.mapper.FlowMapper;
import com.activepieces.flow.model.CreateFlowRequest;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
import com.activepieces.flow.repository.FlowRepository;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.jdbc.lock.JdbcLockRegistry;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;


@Log4j2
@Service
public class FlowServiceImpl implements FlowService {

    private final FlowRepository repository;
    private final FlowVersionServiceImpl flowVersionService;
    private final FlowMapper flowMapper;
    private final PermissionService permissionService;

    @Autowired
    public FlowServiceImpl(
            final FlowRepository repository,
            final FlowVersionServiceImpl flowVersionService,
            final FlowMapper flowMapper,
            final PermissionService permissionService) {
        this.repository = repository;
        this.flowVersionService = flowVersionService;
        this.flowMapper = flowMapper;
        this.permissionService = permissionService;
    }

    @Override
    public SeekPage<FlowView> listByCollectionId(Ksuid integrationId, SeekPageRequest request)
            throws PermissionDeniedException {
        permissionService.requiresPermission(integrationId, Permission.READ_FLOW);
        final List<PageFilter> filters = List.of(new PageFilter(Flow.COLLECTION_ID, integrationId));
        return repository.findPageAsc(filters, request).convert(flowMapper::toView);

    }

    @Override
    public FlowView create(Ksuid projectId, Ksuid collectionId, FlowVersionView flowVersionView)
            throws PermissionDeniedException, ResourceNotFoundException, IOException {
        permissionService.requiresPermission(collectionId, Permission.WRITE_FLOW);
        Ksuid flowId = Ksuid.newKsuid();

        FlowView flowView =
                FlowView.builder()
                        .id(flowId)
                        .collectionId(collectionId)
                        .build();
        Flow savedFlowView = repository.save(flowMapper.fromView(flowView));
        permissionService.createResourceWithParent(flowId, collectionId, ResourceType.FLOW);

        // We need to save the flow then the version in order to attach it to the parent as resource
        FlowVersionView versionView =
                flowVersionService.createNew(flowId, flowVersionView);
        return flowMapper.toView(savedFlowView);
    }

    @Override
    public Optional<FlowView> getOptional(Ksuid id) throws PermissionDeniedException {
        Optional<Flow> flowMetadataOptional = repository.findById(id);
        if (flowMetadataOptional.isEmpty()) {
            return Optional.empty();
        }
        permissionService.requiresPermission(id, Permission.READ_FLOW);
        return flowMetadataOptional.map(flowMapper::toView);
    }

    @Override
    public FlowView get(Ksuid id) throws FlowNotFoundException, PermissionDeniedException {
        Optional<FlowView> flowMetadataOptional = getOptional(id);
        if (flowMetadataOptional.isEmpty()) {
            throw new FlowNotFoundException(id);
        }
        return flowMetadataOptional.get();
    }

    @Override
    public FlowView updateDraft(Ksuid flowId, FlowVersionView request)
            throws FlowNotFoundException, FlowVersionNotFoundException, PermissionDeniedException, ResourceNotFoundException,
            FlowVersionAlreadyLockedException, IOException {
        permissionService.requiresPermission(flowId, Permission.WRITE_FLOW);
        FlowView flow = get(flowId);
        FlowVersionView draft = flow.getLastVersion();
        if (flow.getLastVersion().getState().equals(EditState.LOCKED)) {
            draft = cloneVersion(flowId, draft).getLastVersion();
        }
        FlowVersionView updatedVersion = flowVersionService.update(draft.getId(), request);
        flow.updateOrCreateDraft(updatedVersion);
        return saveFromView(flow);
    }

    private FlowView cloneVersion(Ksuid flowId, FlowVersionView draftVersion)
            throws FlowNotFoundException, PermissionDeniedException,
            ResourceNotFoundException, IOException {
        FlowView flow = get(flowId);
        FlowVersionView clonedVersion =
                flowVersionService.createNew(flowId, draftVersion);
        flow.updateOrCreateDraft(clonedVersion);
        return saveFromView(flow);
    }

    private FlowView saveFromView(FlowView flow) {
        return flowMapper.toView(repository.save(flowMapper.fromView(flow)));
    }

    @Override
    public void delete(Ksuid id) throws FlowNotFoundException, PermissionDeniedException {
        permissionService.requiresPermission(id, Permission.WRITE_FLOW);
        if (!repository.existsById(id)) {
            throw new FlowNotFoundException(id);
        }
        repository.deleteById(id);
    }
}

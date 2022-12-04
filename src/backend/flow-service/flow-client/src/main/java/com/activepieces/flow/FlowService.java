package com.activepieces.flow;


import com.activepieces.common.error.exception.CodeArtifactBuildFailure;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.github.ksuid.Ksuid;

import java.util.Optional;

public interface FlowService {

    SeekPage<FlowView> listByCollectionId(Ksuid integrationId, SeekPageRequest pageRequest) throws FlowNotFoundException, PermissionDeniedException;

    FlowView create(Ksuid projectId, Ksuid integrationId, FlowVersionView view) throws FlowVersionNotFoundException, PermissionDeniedException, ResourceNotFoundException, CodeArtifactBuildFailure;

    Optional<FlowView> getOptional(Ksuid id) throws PermissionDeniedException;

    FlowView get(Ksuid id) throws FlowNotFoundException, PermissionDeniedException;

    FlowView updateDraft(Ksuid flowId, FlowVersionView view)
            throws FlowNotFoundException,  FlowVersionNotFoundException, PermissionDeniedException, ResourceNotFoundException, FlowVersionAlreadyLockedException, CodeArtifactBuildFailure;

    void delete(Ksuid id) throws FlowNotFoundException, ResourceNotFoundException, PermissionDeniedException;
}

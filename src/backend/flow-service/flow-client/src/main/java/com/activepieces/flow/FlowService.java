package com.activepieces.flow;


import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.common.error.exception.CodeArtifactBuildFailure;
import com.activepieces.common.error.exception.InvalidCodeArtifactException;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.flow.model.CreateFlowRequest;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;

import java.util.Optional;
import java.util.UUID;

public interface FlowService {

    SeekPage<FlowView> listByCollectionId(UUID integrationId, SeekPageRequest pageRequest) throws FlowNotFoundException, PermissionDeniedException;

    int countByCollectionId(UUID collectionId) throws FlowNotFoundException, PermissionDeniedException;

    FlowView create(UUID projectId, UUID integrationId, CreateFlowRequest view) throws FlowVersionNotFoundException, PermissionDeniedException, ResourceNotFoundException, CodeArtifactBuildFailure;

    Optional<FlowView> getOptional(UUID id) throws PermissionDeniedException;

    FlowView get(UUID id) throws FlowNotFoundException, PermissionDeniedException;

    FlowView updateDraft(UUID flowId, FlowVersionView view, long updateTimestamp)
            throws FlowNotFoundException,  FlowVersionNotFoundException, PermissionDeniedException, ResourceNotFoundException, FlowVersionAlreadyLockedException, CodeArtifactBuildFailure;

    void archive(UUID id) throws FlowNotFoundException, ResourceNotFoundException, PermissionDeniedException;
}

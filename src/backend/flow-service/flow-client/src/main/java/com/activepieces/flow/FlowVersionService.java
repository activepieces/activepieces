package com.activepieces.flow;

import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.flow.model.FlowVersionMetaView;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlowVersionService {

    Optional<FlowVersionView> getOptional(UUID id) throws PermissionDeniedException;

    List<FlowVersionMetaView> listByFlowId(UUID flowId) throws PermissionDeniedException;

    FlowVersionView get(UUID id) throws FlowVersionNotFoundException, PermissionDeniedException;

    void lock(UUID id) throws FlowVersionAlreadyLockedException, FlowVersionNotFoundException, PermissionDeniedException;

}

package com.activepieces.flow;

import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.flow.model.FlowVersionMetaView;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.github.ksuid.Ksuid;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlowVersionService {

    Optional<FlowVersionView> getOptional(Ksuid id) throws PermissionDeniedException;

    List<FlowVersionMetaView> listByFlowId(Ksuid flowId) throws PermissionDeniedException;

    FlowVersionView get(Ksuid id) throws FlowVersionNotFoundException, PermissionDeniedException;

    void lock(Ksuid id) throws FlowVersionAlreadyLockedException, FlowVersionNotFoundException, PermissionDeniedException;

}

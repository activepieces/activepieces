package com.activepieces.action;

import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.flow.FlowExecutionInternalError;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.logging.client.model.InstanceRunView;
import com.github.ksuid.Ksuid;
import lombok.NonNull;

import java.util.Map;

public interface FlowPublisherService {

    InstanceRunView executeTest(@NonNull final Ksuid collectionVersionId,
                                @NonNull final Ksuid flowVersionID,
                                @NonNull Map<String, Object> triggerPayload) throws FlowExecutionInternalError, ResourceNotFoundException;

    InstanceRunView executeInstance(@NonNull final Ksuid instanceId, @NonNull Ksuid flowVersionId, @NonNull Map<String, Object> triggerPayload) throws FlowExecutionInternalError, ResourceNotFoundException, InstanceNotFoundException, PermissionDeniedException;


}

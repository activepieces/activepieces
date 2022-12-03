package com.activepieces.action;

import com.activepieces.common.error.exception.flow.FlowExecutionInternalError;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.variable.model.exception.MissingConfigsException;
import com.github.ksuid.Ksuid;
import lombok.NonNull;

import java.util.Map;
import java.util.UUID;

public interface FlowPublisherService {

    InstanceRunView executeTest(@NonNull final Ksuid collectionVersionId,
                                @NonNull final Ksuid flowVersionID,
                                @NonNull Map<String,Object> variables,
                                @NonNull Map<String, Object> triggerPayload) throws FlowExecutionInternalError, ResourceNotFoundException;

    InstanceRunView executeInstance(@NonNull final Ksuid instanceId, @NonNull Ksuid flowVersionId, @NonNull Map<String, Object> flowConfigs, @NonNull Map<String, Object> triggerPayload, boolean async) throws FlowExecutionInternalError, MissingConfigsException, ResourceNotFoundException;


}

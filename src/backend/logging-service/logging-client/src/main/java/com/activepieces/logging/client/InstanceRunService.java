package com.activepieces.logging.client;

import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.logging.client.exception.InstanceRunNotFoundException;
import com.activepieces.logging.client.model.InstanceRunView;
import lombok.NonNull;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

public interface InstanceRunService {

  Optional<InstanceRunView> getOptional(@NonNull final UUID id) throws PermissionDeniedException;

  SeekPage<InstanceRunView> list(@NonNull final UUID environmentId, final UUID accountId, final UUID instanceId, SeekPageRequest request) throws InstanceRunNotFoundException, PermissionDeniedException;

  InstanceRunView get(@NonNull final UUID id) throws InstanceRunNotFoundException, PermissionDeniedException;

  InstanceRunView createOrUpdate(@NonNull InstanceRunView request, ExecutionStateView executionStateView) throws ResourceNotFoundException, PermissionDeniedException, InstanceNotFoundException, InvalidImageFormatException, IOException;

  int countByInstanceId(UUID instanceId) throws PermissionDeniedException;

}

package com.activepieces.logging.client;

import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.logging.client.exception.InstanceRunNotFoundException;
import com.activepieces.logging.client.model.InstanceRunView;
import com.github.ksuid.Ksuid;
import lombok.NonNull;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

public interface InstanceRunService {

  Optional<InstanceRunView> getOptional(@NonNull final Ksuid id) throws PermissionDeniedException;

  SeekPage<InstanceRunView> list(@NonNull final Ksuid projectId, @NonNull final SeekPageRequest request) throws InstanceRunNotFoundException, PermissionDeniedException;

  InstanceRunView get(@NonNull final Ksuid id) throws InstanceRunNotFoundException, PermissionDeniedException;

  InstanceRunView createOrUpdate(@NonNull InstanceRunView request, ExecutionStateView executionStateView) throws ResourceNotFoundException, PermissionDeniedException, InstanceNotFoundException, InvalidImageFormatException, IOException;


}

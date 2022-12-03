package com.activepieces.apikey.client;

import com.activepieces.common.error.exception.ApiKeyNotFoundException;
import com.activepieces.apikey.client.model.ApiKeyView;
import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import lombok.NonNull;

import java.util.Optional;
import java.util.UUID;

public interface ApiKeyService {

  Optional<ApiKeyView> getOptional(@NonNull final UUID id) throws PermissionDeniedException;

  Optional<ApiKeyView> getBySecretKeyOptional(@NonNull final String secretKey);

  SeekPage<ApiKeyView> list(@NonNull final UUID environmentId, SeekPageRequest request) throws ApiKeyNotFoundException, PermissionDeniedException;

  ApiKeyView getBySecretKey(@NonNull final String secretKey) throws ApiKeyNotFoundException;

  ApiKeyView getById(@NonNull final UUID id) throws ApiKeyNotFoundException, PermissionDeniedException;

  ApiKeyView create(@NonNull final UUID environmentId, @NonNull final ApiKeyView request) throws ResourceNotFoundException, PermissionDeniedException;

  void delete(@NonNull final UUID id) throws ApiKeyNotFoundException, ResourceNotFoundException, PermissionDeniedException;
}

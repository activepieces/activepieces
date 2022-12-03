package com.activepieces.apikey.server.service;

import com.activepieces.apikey.client.ApiKeyService;
import com.activepieces.common.error.exception.ApiKeyNotFoundException;
import com.activepieces.apikey.client.mapper.ApiKeyMapper;
import com.activepieces.apikey.client.model.ApiKeyView;
import com.activepieces.apikey.server.repository.ApiKeyRepository;
import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.enums.Role;
import com.activepieces.entity.sql.ApiKey;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import lombok.NonNull;
import org.apache.commons.lang.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class ApiKeyServiceImpl implements ApiKeyService {

  private final ApiKeyRepository apiKeyRepository;
  private final PermissionService permissionService;
  private final ApiKeyMapper mapper;

  @Autowired
  public ApiKeyServiceImpl(
      @NonNull final ApiKeyRepository apiKeyRepository,
      @NonNull final ApiKeyMapper mapper,
      @NonNull final PermissionService permissionService) {
    this.apiKeyRepository = apiKeyRepository;
    this.mapper = mapper;
    this.permissionService = permissionService;
  }

  @Override
  public Optional<ApiKeyView> getOptional(@NonNull UUID id) throws PermissionDeniedException {
    Optional<ApiKey> apiKeyOptional = apiKeyRepository.findById(id);
    if (apiKeyOptional.isEmpty()) {
      return Optional.empty();
    }
    permissionService.requiresPermission(id, Permission.READ_API_KEY);
    return Optional.of(mapper.toView(apiKeyOptional.get()));
  }

  @Override
  public Optional<ApiKeyView> getBySecretKeyOptional(@NonNull String secretKey) {
    Optional<ApiKey> apiKeyOptional = apiKeyRepository.findBySecret(secretKey);
    if (apiKeyOptional.isEmpty()) {
      return Optional.empty();
    }
    return Optional.of(mapper.toView(apiKeyOptional.get()));
  }

  @Override
  public SeekPage<ApiKeyView> list(@NonNull UUID projectId, @NonNull SeekPageRequest request)
      throws ApiKeyNotFoundException, PermissionDeniedException {
    permissionService.requiresPermission(projectId, Permission.READ_API_KEY);
    Slice<ApiKey> slice;
    if (request.hasStartingAfter()) {
      ApiKeyView view = getById(request.getStartingAfter());
      slice =
          apiKeyRepository
              .findAllByProjectIdAndEpochCreationTimeGreaterThanOrEpochCreationTimeEqualsAndIdLessThanOrderByEpochCreationTimeAscIdDesc(
                  projectId,
                  view.getEpochCreationTime(),
                  view.getEpochCreationTime(),
                  view.getId(),
                  PageRequest.of(0, request.getLimit()));
    } else {
      slice =
          apiKeyRepository.findAllByProjectIdOrderByEpochCreationTimeAscIdDesc(
              projectId, PageRequest.of(0, request.getLimit()));
    }
    return new SeekPage<>(
        request.getStartingAfter(), request.getEndingBefore(), slice.map(mapper::toView));
  }

  @Override
  public ApiKeyView getBySecretKey(@NonNull String secretKey) throws ApiKeyNotFoundException {
    Optional<ApiKeyView> apiKeyOptional = getBySecretKeyOptional(secretKey);
    if (apiKeyOptional.isEmpty()) {
      throw new ApiKeyNotFoundException(secretKey);
    }
    return apiKeyOptional.get();
  }

  @Override
  public ApiKeyView getById(@NonNull UUID id)
      throws ApiKeyNotFoundException, PermissionDeniedException {
    Optional<ApiKeyView> apiKeyOptional = getOptional(id);
    if (apiKeyOptional.isEmpty()) {
      throw new ApiKeyNotFoundException(id);
    }
    return apiKeyOptional.get();
  }

  @Override
  public ApiKeyView create(@NonNull UUID projectId, @NonNull final ApiKeyView request)
      throws ResourceNotFoundException, PermissionDeniedException {
    permissionService.requiresPermission(projectId, Permission.WRITE_API_KEY);
    ApiKey apiKey =
        ApiKey.builder()
            .name(request.getName())
            .projectId(projectId)
            .epochCreationTime(Instant.now().getEpochSecond())
            .secret(generateRandomSecretKey())
            .build();
    ApiKeyView apiKeyView = mapper.toView(apiKeyRepository.save(apiKey));
    permissionService.createResourceWithParent(apiKey.getId(), projectId, ResourceType.API_KEY);
    permissionService.grantRole(projectId, apiKeyView.getId(), Role.API_KEY);
    return apiKeyView;
  }

  @Override
  public void delete(@NonNull UUID id)
      throws ApiKeyNotFoundException, ResourceNotFoundException, PermissionDeniedException {
    if (!apiKeyRepository.existsById(id)) {
      throw new ApiKeyNotFoundException(id);
    }
    permissionService.requiresPermission(id, Permission.WRITE_API_KEY);
    permissionService.deleteOrAchiveResource(id);
  }

  private String generateRandomSecretKey() {
    return String.format("ak_%s", RandomStringUtils.randomAlphabetic(24));
  }

}

package com.activepieces.guardian.client;

import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.enums.Role;
import com.activepieces.entity.sql.Resource;
import com.activepieces.entity.sql.ResourceAccess;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import lombok.NonNull;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Future;


public interface PermissionService {

  void requiresPermission(
      @NonNull final UUID resourceId,
      @NonNull final Permission permission)
      throws PermissionDeniedException;

  boolean hasPermission(
          @NonNull UUID resourceId, @NonNull Permission permission);

  void grantRole(
      @NonNull final UUID resourceId, @NonNull final UUID roleResourceId, @NonNull final Role role);

  Resource getFirstResourceParentWithType(UUID resourceId, ResourceType resourceType) throws ResourceNotFoundException;

  Resource createResource(UUID id, ResourceType resourceType);

  Resource createResourceWithParent(UUID id, UUID parentId, ResourceType resourceType) throws ResourceNotFoundException;

  void deleteOrAchiveResource(UUID resourceId) throws ResourceNotFoundException;

  Future<Void> deleteResourceAsync(UUID resourceId) throws ResourceNotFoundException;


  Resource getResource(UUID resourceId) throws ResourceNotFoundException;
}

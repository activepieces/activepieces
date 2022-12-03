package com.activepieces.guardian.client;

import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.enums.Role;
import com.activepieces.entity.sql.Resource;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.github.ksuid.Ksuid;
import lombok.NonNull;

import java.util.UUID;
import java.util.concurrent.Future;


public interface PermissionService {

  void requiresPermission(
      @NonNull final Ksuid resourceId,
      @NonNull final Permission permission)
      throws PermissionDeniedException;

  boolean hasPermission(
          @NonNull Ksuid resourceId, @NonNull Permission permission);

  void grantRole(
      @NonNull final Ksuid resourceId, @NonNull final Ksuid roleResourceId, @NonNull final Role role);

  Resource getFirstResourceParentWithType(Ksuid resourceId, ResourceType resourceType) throws ResourceNotFoundException;

  Resource createResource(Ksuid id, ResourceType resourceType);

  Resource createResourceWithParent(Ksuid id, Ksuid parentId, ResourceType resourceType) throws ResourceNotFoundException;

  void deleteOrAchiveResource(Ksuid resourceId) throws ResourceNotFoundException;

  Future<Void> deleteResourceAsync(Ksuid resourceId) throws ResourceNotFoundException;


  Resource getResource(Ksuid resourceId) throws ResourceNotFoundException;
}

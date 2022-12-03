package com.activepieces.guardian.server.service;

import com.activepieces.common.identity.PrincipleIdentity;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.enums.Role;
import com.activepieces.entity.sql.Resource;
import com.activepieces.entity.sql.ResourceAccess;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.guardian.client.model.ResourceEventType;
import com.activepieces.guardian.server.ResourcePublisher;
import com.activepieces.guardian.server.repository.ResourceAccessRepository;
import com.activepieces.guardian.server.repository.ResourceRepository;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.social.InternalServerErrorException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Future;

@Log4j2
@Service
public class PermissionsServiceImpl implements PermissionService {

  private final ResourceAccessRepository resourceAccessRepository;
  private final ResourceRepository resourceRepository;
  private final ResourcePublisher resourcePublisher;

  @Autowired
  public PermissionsServiceImpl(
      ResourceRepository resourceRepository,
      ResourceAccessRepository resourceAccessRepository,
      ResourcePublisher resourcePublisher) {
    this.resourcePublisher = resourcePublisher;
    this.resourceAccessRepository = resourceAccessRepository;
    this.resourceRepository = resourceRepository;
  }

  @Override
  public void requiresPermission(@NonNull UUID resourceId, @NonNull Permission permission)
      throws PermissionDeniedException {
    if (!hasPermission(resourceId, permission)) {
      throw new PermissionDeniedException("Permission required: " + permission);
    }
  }

  @Override
  public boolean hasPermission(@NonNull UUID resourceId, @NonNull Permission permission) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    // Internal traffic, as its null
    // TODO REPLACE WITH SPECIAL INSIDE SECURITY
    if (Objects.isNull(authentication)) return true;
    Object principle = authentication.getPrincipal();
    if (Objects.isNull(principle)) return false;
    PrincipleIdentity resourceIdentity = (PrincipleIdentity) principle;
    return recursiveLookUp(resourceId, permission, resourceIdentity.getId());
  }


  private boolean recursiveLookUp(
      @NonNull UUID resourceId, @NonNull Permission permission, @NonNull UUID roleResourceId) {
    try {
      Resource resource = getResource(resourceId);
      Optional<ResourceAccess> resourceAccessOptional =
          this.resourceAccessRepository.findByResourceIdAndPrincipleId(resourceId, roleResourceId);
      if (resourceAccessOptional.isPresent()) {
        return resourceAccessOptional.get().getRole().hasPermission(permission);
      }
      if (Objects.nonNull(resource.getParentResourceId())) {
        return recursiveLookUp(resource.getParentResourceId(), permission, roleResourceId);
      }
    } catch (ResourceNotFoundException ignored) {
      ignored.printStackTrace();
    }
    return false;
  }

  @Override
  public void grantRole(@NonNull UUID resourceId, @NonNull UUID principleId, @NonNull Role role) {
    ResourceAccess resourceAccess =
        ResourceAccess.builder().resourceId(resourceId).principleId(principleId).role(role).build();
    log.info(principleId + " has granted role " + role + " on resourceId=" + resourceId);
    resourceAccessRepository.save(resourceAccess);
  }

  @Override
  public Resource getFirstResourceParentWithType(UUID resourceId, ResourceType resourceType)
      throws ResourceNotFoundException {
    Resource resource = getResource(resourceId);
    if (resource.getResourceType().equals(resourceType)) {
      return resource;
    }
    Resource parentResource = resource.getParent();
    if (Objects.isNull(parentResource)) {
      return null;
    }
    return getFirstResourceParentWithType(parentResource.getResourceId(), resourceType);
  }

  @Override
  public Resource createResource(UUID id, ResourceType resourceType) {
    try {
      return createResourceWithParent(id, null, resourceType);
    } catch (ResourceNotFoundException e) {
      throw new InternalServerErrorException("PermissionService", e.getMessage());
    }
  }

  @Override
  public Resource createResourceWithParent(UUID id, UUID parentId, ResourceType resourceType)
      throws ResourceNotFoundException {
    Resource.ResourceBuilder builder = Resource.builder().resourceId(id).resourceType(resourceType);
    if (Objects.nonNull(parentId)) {
      builder.parent(getResource(parentId));
      builder.parentResourceId(parentId);
    }
    Resource resource = resourceRepository.save(builder.build());
    log.debug(
        String.format(
            "Created Resource with id=%s with type=%s",
            resource.getResourceId(), resource.getResourceType().toString()));
    return resource;
  }

  @Override
  public void deleteOrAchiveResource(UUID resourceId) throws ResourceNotFoundException {
    Resource resource = getResource(resourceId);
    if (!skipChildren(resource.getResourceType())) {
      for (Resource child : resourceRepository.findAllByParentResourceId(resourceId)) {
        deleteOrAchiveResource(child.getResourceId());
      }
    }
    log.info(
        String.format(
            "Deleted Resource with id=%s with type=%s",
            resource.getResourceId(), resource.getResourceType().toString()));
    resourcePublisher.notify(ResourceEventType.DELETE, resource);
    if (!isLazyDeleted(resource.getResourceType())) {
      resourceRepository.deleteById(resource.getResourceId());
    }
  }

  // This resource don't get deleted, they are just marked as archive and will be deleted later.
  private boolean isLazyDeleted(ResourceType resourceType) {
    return resourceType.equals(ResourceType.INSTANCE);
  }

  // Skip Runs as there could be too many of them and deleting would take long, since stale runs
  // will be deleted anyway.
  private boolean skipChildren(ResourceType resourceType) {
    return resourceType.equals(ResourceType.INSTANCE);
  }

  @Override
  @Async
  public Future<Void> deleteResourceAsync(UUID resourceId) throws ResourceNotFoundException {
    deleteOrAchiveResource(resourceId);
    return CompletableFuture.completedFuture(null);
  }

  @Override
  public Resource getResource(UUID resourceId) throws ResourceNotFoundException {
    return resourceRepository
        .findById(resourceId)
        .orElseThrow(() -> new ResourceNotFoundException(resourceId));
  }
}

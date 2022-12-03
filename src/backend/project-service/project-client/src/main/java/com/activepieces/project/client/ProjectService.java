package com.activepieces.project.client;

import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.project.client.exception.ProjectNotFoundException;
import com.activepieces.project.client.model.CreateProjectRequest;
import com.activepieces.project.client.model.ProjectView;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectService {

  List<ProjectView> listByOwnerId(UUID userId) ;

  ProjectView create( UUID ownerId, CreateProjectRequest view) throws PermissionDeniedException;

  Optional<ProjectView> getOptional(UUID id) throws PermissionDeniedException;

  ProjectView get(UUID id) throws ProjectNotFoundException, PermissionDeniedException;

  ProjectView update(UUID id, ProjectView view, Optional<MultipartFile> fileOptional)
          throws ProjectNotFoundException, PermissionDeniedException, InvalidImageFormatException, IOException;

  void delete(UUID id) throws ProjectNotFoundException, PermissionDeniedException, ResourceNotFoundException;
}

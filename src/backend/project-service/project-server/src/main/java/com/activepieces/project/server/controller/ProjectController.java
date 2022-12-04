package com.activepieces.project.server.controller;

import com.activepieces.common.identity.UserIdentity;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.project.client.ProjectService;
import com.activepieces.project.client.exception.ProjectNotFoundException;
import com.activepieces.project.client.model.CreateProjectRequest;
import com.activepieces.project.client.model.ProjectView;
import com.github.ksuid.Ksuid;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@Hidden
@RequestMapping
public class ProjectController {

  private final ProjectService projectService;

  @Autowired
  public ProjectController(
      @NonNull final ProjectService projectService) {
    this.projectService = projectService;
  }

  @Secured("ROLE_USER")
  @GetMapping("/projects")
  public ResponseEntity<List<ProjectView>> listForUser(
      @AuthenticationPrincipal UserIdentity userIdentity) {
    return ResponseEntity.ok(
        projectService.listByOwnerId(userIdentity.getId()));
  }

  @Secured("ROLE_USER")
  @GetMapping("/projects/{projectId}")
  public ResponseEntity<ProjectView> get(@PathVariable("projectId") Ksuid projectId)
      throws ProjectNotFoundException, PermissionDeniedException {
    return ResponseEntity.ok(projectService.get(projectId));
  }

  @Secured("ROLE_USER")
  @PutMapping("/projects/{projectId}")
  public ResponseEntity<ProjectView> update(
      @PathVariable("projectId") Ksuid projectId,
      @RequestBody @Valid ProjectView view)
      throws ProjectNotFoundException, PermissionDeniedException {
    return ResponseEntity.ok(projectService.update(projectId, view));
  }

}

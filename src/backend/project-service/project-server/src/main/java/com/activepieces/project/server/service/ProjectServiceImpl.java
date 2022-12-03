package com.activepieces.project.server.service;

import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.enums.Role;
import com.activepieces.entity.sql.Project;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.project.client.ProjectService;
import com.activepieces.project.client.exception.ProjectNotFoundException;
import com.activepieces.project.client.mapper.ProjectMapper;
import com.activepieces.project.client.model.CreateProjectRequest;
import com.activepieces.project.client.model.ProjectView;
import com.activepieces.project.server.repository.ProjectRepository;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final PermissionService permissionService;
    private final ProjectMapper projectMapper;

    @Autowired
    public ProjectServiceImpl(
            @NonNull final ProjectRepository projectRepository,
            @NonNull final PermissionService permissionService,
            @NonNull final ProjectMapper projectMapper) {
        this.permissionService = permissionService;
        this.projectMapper = projectMapper;
        this.projectRepository = projectRepository;
    }

    @Override
    public List<ProjectView> listByOwnerId(Ksuid userId) {
        ArrayList<ProjectView> projectViewArrayList = new ArrayList<>();
        List<Project> projectList = projectRepository.findAllByOwnerId(userId);
        for (Project project : projectList) {
            projectViewArrayList.add(projectMapper.toView(project));
        }
        return projectViewArrayList;
    }

    @Override
    public ProjectView create(@NonNull final Ksuid ownerId, @NonNull final CreateProjectRequest request) {
        Project project =
                Project.builder()
                        .id(Ksuid.newKsuid())
                        .epochCreationTime(Instant.now().getEpochSecond())
                        .epochUpdateTime(Instant.now().getEpochSecond())
                        .ownerId(ownerId)
                        .displayName(request.getDisplayName())
                        .build();
        project = projectRepository.save(project);
        permissionService.createResource(
                project.getId(), ResourceType.PROJECT);
        permissionService.grantRole(project.getId(), ownerId, Role.OWNER);
        return projectMapper.toView(projectRepository.findById(project.getId()).get());
    }

    @Override
    public Optional<ProjectView> getOptional(@NonNull final Ksuid id)
            throws PermissionDeniedException {
        Optional<Project> projectOptional = projectRepository.findById(id);
        if (projectOptional.isEmpty()) {
            return Optional.empty();
        }
        permissionService.requiresPermission(id, Permission.READ_PROJECT);
        return Optional.of(projectMapper.toView(projectOptional.get()));
    }

    @Override
    public ProjectView get(@NonNull final Ksuid id)
            throws ProjectNotFoundException, PermissionDeniedException {
        Optional<ProjectView> projectViewOptional = getOptional(id);
        if (projectViewOptional.isEmpty()) {
            throw new ProjectNotFoundException(id);
        }
        return projectViewOptional.get();
    }
    @Override
    public ProjectView update(@NonNull final Ksuid id, @NonNull final ProjectView view, @NonNull Optional<MultipartFile> logo)
            throws ProjectNotFoundException, PermissionDeniedException, InvalidImageFormatException, IOException {
        permissionService.requiresPermission(id, Permission.WRITE_PROJECT);
        Optional<Project> projectOptional = projectRepository.findById(id);
        if (projectOptional.isEmpty()) {
            throw new ProjectNotFoundException(id);
        }
        Project project = projectOptional.get();
        project.setDisplayName(view.getDisplayName());
        project.setEpochUpdateTime(Instant.now().getEpochSecond());
        return projectMapper.toView(projectRepository.save(project));
    }

    @Override
    public void delete(@NonNull final Ksuid id)
            throws ProjectNotFoundException, PermissionDeniedException, ResourceNotFoundException {
        if (!projectRepository.existsById(id)) {
            throw new ProjectNotFoundException(id);
        }
        permissionService.requiresPermission(id, Permission.WRITE_PROJECT);
        permissionService.deleteOrAchiveResource(id);
    }
}

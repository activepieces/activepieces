package com.activepieces.logging.server;

import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.pagination.PageFilter;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.sql.InstanceRun;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.activepieces.file.service.FileService;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.exception.InstanceRunNotFoundException;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.logging.server.mapper.InstanceRunMapper;
import com.activepieces.logging.server.repository.InstanceRunRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Service
@Log4j2
public class InstanceRunServiceImpl implements InstanceRunService {

  private final InstanceRunRepository repository;
  private final PermissionService permissionService;
  private final InstanceRunMapper mapper;
  private final FileService fileService;
  private final Executor executor;
  private final ObjectMapper objectMapper;

  @Autowired
  public InstanceRunServiceImpl(
      final ObjectMapper objectMapper,
      final FileService fileService,
      InstanceRunRepository repository,
      PermissionService permissionService,
      InstanceRunMapper mapper)
      throws IOException {
    this.fileService = fileService;
    this.executor = Executors.newFixedThreadPool(8);
    this.permissionService = permissionService;
    this.repository = repository;
    this.objectMapper = objectMapper;
    this.mapper = mapper;
  }

  @Override
  public Optional<InstanceRunView> getOptional(@NonNull Ksuid id) throws PermissionDeniedException {
    Optional<InstanceRun> eventOptional = repository.findById(id);
    if (eventOptional.isEmpty()) {
      return Optional.empty();
    }
    permissionService.requiresPermission(id, Permission.READ_INSTANCE_RUN);
    InstanceRunView instanceRunView = mapper.toView(eventOptional.get());
    // TODO FIX
/*    instanceRunView.setStateUrl(generateUrl(id));*/
    return Optional.of(instanceRunView);
  }

  @Override
  public SeekPage<InstanceRunView> list(
      @NonNull final Ksuid projectId,
      @NonNull final SeekPageRequest request)
      throws InstanceRunNotFoundException, PermissionDeniedException {
    permissionService.requiresPermission(projectId, Permission.READ_INSTANCE_RUN);
    final List<PageFilter> filters = List.of(new PageFilter(InstanceRun.PROJECT_ID, projectId));
    return repository.findPageAsc( filters, request).convert(mapper::toView);
  }

  @Override
  public InstanceRunView get(@NonNull Ksuid id)
      throws InstanceRunNotFoundException, PermissionDeniedException {
    Optional<InstanceRunView> runOptional = getOptional(id);
    if (runOptional.isEmpty()) {
      throw new InstanceRunNotFoundException(id);
    }
    return runOptional.get();
  }

  @Override
  public InstanceRunView createOrUpdate(
      @NonNull InstanceRunView request, @NonNull ExecutionStateView executionStateView)
      throws ResourceNotFoundException, PermissionDeniedException,
          InstanceNotFoundException, IOException {
    Ksuid parentResourceId =
        Objects.isNull(request.getInstanceId())
            ? request.getFlowVersionId()
            : request.getInstanceId();
    // No need for permissions as this will be used internally
    // permissionService.requiresPermission(parentResourceId, Permission.CREATE_INSTANCE_RUN);

    request.setProjectId(request.getProjectId());
    request.setLogsUploaded(false);

    InstanceRunView savedView = mapper.toView(repository.save(mapper.fromView(request)));
    permissionService.createResourceWithParent(
        savedView.getId(), parentResourceId, ResourceType.INSTANCE_RUN);

    // They are lost due the transitions to database model and back
    savedView.setState(executionStateView);
    // TODO FIX
/*    savedView.setStateUrl(generateUrl(savedView.getId()));
    savedView.setOutput(request.getOutput());

    executor.execute(
        () -> {
          try {
            String json = objectMapper.writeValueAsString(executionStateView);
            fileService.save(executionStateView)
            savedView.setLogsUploaded(true);
            repository.save(mapper.fromView(savedView));
          } catch (JsonProcessingException e) {
            throw errorServiceHandler.createInternalError(e);
          }
        });*/
    return savedView;
  }




}

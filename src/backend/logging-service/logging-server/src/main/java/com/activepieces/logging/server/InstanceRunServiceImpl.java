package com.activepieces.logging.server;

import com.activepieces.common.AggregateKey;
import com.activepieces.common.PaginationService;
import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.nosql.InstanceRun;
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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

@Service
@Log4j2
public class InstanceRunServiceImpl implements InstanceRunService {

  private final InstanceRunRepository repository;
  private final PermissionService permissionService;
  private final PaginationService paginationService;
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
      PaginationService paginationService,
      InstanceRunMapper mapper)
      throws IOException {
    this.fileService = fileService;
    this.executor = Executors.newFixedThreadPool(8);
    this.permissionService = permissionService;
    this.repository = repository;
    this.objectMapper = objectMapper;
    this.paginationService = paginationService;
    this.mapper = mapper;
  }

  @Override
  public Optional<InstanceRunView> getOptional(@NonNull UUID id) throws PermissionDeniedException {
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
      @NonNull final UUID environmentId,
      final UUID accountId,
      final UUID instanceId,
      SeekPageRequest request)
      throws InstanceRunNotFoundException, PermissionDeniedException {
    permissionService.requiresPermission(environmentId, Permission.READ_INSTANCE_RUN);
    InstanceRun startingAfter =
        Objects.nonNull(request.getStartingAfter())
            ? mapper.fromView(get(request.getStartingAfter()))
            : null;
    InstanceRun endingBefore =
        Objects.nonNull(request.getEndingBefore())
            ? mapper.fromView(get(request.getEndingBefore()))
            : null;
    final AggregateKey aggregateKey =
        AggregateKey.builder()
            .aggregateKey(InstanceRun.PROJECT_ID)
            .value(environmentId)
            .build();
    final List<Criteria> criteriaList = new ArrayList<>();
    if (Objects.nonNull(instanceId)) {
      criteriaList.add(new Criteria(InstanceRun.INSTANCE_ID).is(instanceId));
    }
    SeekPage<InstanceRun> environmentSeekPage =
        paginationService.paginationTimeDesc(
            aggregateKey,
            startingAfter,
            endingBefore,
            request.getLimit(),
            InstanceRun.class,
            criteriaList);
    return environmentSeekPage.convert(mapper::toView);
  }

  @Override
  public InstanceRunView get(@NonNull UUID id)
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
          InstanceNotFoundException, InvalidImageFormatException, IOException {
    UUID parentResourceId =
        Objects.isNull(request.getInstanceId())
            ? request.getFlowVersionId()
            : request.getInstanceId();
    // No need for permissions as this will be used internally
    // permissionService.requiresPermission(parentResourceId, Permission.CREATE_INSTANCE_RUN);

    request.setProjectId(request.getProjectId());
    request.setEpochUpdateTime(Instant.now().getEpochSecond());
    request.setEpochCreationTime(Instant.now().getEpochSecond());
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




  @Override
  public int countByInstanceId(UUID instanceId) throws PermissionDeniedException {
    permissionService.requiresPermission(instanceId, Permission.READ_INSTANCE_RUN);
    return repository.countByInstanceId(instanceId);
  }
}

package com.activepieces.instance;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.pagination.PageFilter;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.sql.Instance;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.instance.client.InstancePublisher;
import com.activepieces.instance.client.InstanceService;
import com.activepieces.instance.client.mapper.InstanceMapper;
import com.activepieces.instance.client.model.CreateOrUpdateInstanceRequest;
import com.activepieces.instance.client.model.InstanceEventType;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.instance.repository.InstanceRepository;
import com.activepieces.piece.client.CollectionService;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import com.activepieces.variable.model.VariableService;
import com.activepieces.variable.model.exception.MissingConfigsException;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Log4j2
public class InstanceServiceImpl implements InstanceService {

  private final InstanceRepository instanceRepository;
  private final InstanceMapper instanceMapper;
  private final PermissionService permissionService;
  private final InstancePublisher instancePublisher;
  private final VariableService variableService;
  private final CollectionVersionService collectionVersionService;
  private final CollectionService collectionService;
  private final FlowVersionService flowVersionService;
  private final ErrorServiceHandler errorServiceHandler;

  @Autowired
  public InstanceServiceImpl(
      @NonNull final FlowVersionService flowVersionService,
      @NonNull final ErrorServiceHandler errorServiceHandler,
      @NonNull final InstanceRepository instanceRepository,
      @NonNull final InstanceMapper instanceMapper,
      @NonNull final VariableService variableService,
      @NonNull final CollectionService collectionService,
      @NonNull final CollectionVersionService collectionVersionService,
      @NonNull final PermissionService permissionService,
      @NonNull final InstancePublisher instancePublisher) {
    this.flowVersionService = flowVersionService;
    this.errorServiceHandler = errorServiceHandler;
    this.collectionService = collectionService;
    this.collectionVersionService = collectionVersionService;
    this.instanceRepository = instanceRepository;
    this.variableService = variableService;
    this.instancePublisher = instancePublisher;
    this.permissionService = permissionService;
    this.instanceMapper = instanceMapper;
  }

  // TODO USE IN PUBLISH
  public List<InstanceView> upgradeAllInstances(Ksuid collectionVersionId)
      throws PermissionDeniedException, CollectionNotFoundException,
          CollectionVersionNotFoundException {
    permissionService.requiresPermission(collectionVersionId, Permission.READ_INSTANCE);
    CollectionVersionView collectionVersionView = collectionVersionService.get(collectionVersionId);
    CollectionView collectionView = collectionService.get(collectionVersionView.getCollectionId());
    List<InstanceView> instanceList =
        listInstanceForCollectionId(collectionView).stream()
            .map(
                instanceView ->
                    upgradeInstance(
                        instanceView.toBuilder()
                            .collectionVersionId(collectionVersionId)
                            .build()))
            .collect(Collectors.toList());
    log.info(
        "Upgraded {} instances for collection version {}",
        instanceList.size(),
        collectionVersionId);
    return instanceList;
  }

  private InstanceView upgradeInstance(InstanceView instanceView) {
    InstanceView savedInstance = saveFromView(instanceView);
    instancePublisher.notify(InstanceEventType.UPDATE, instanceView);
    return savedInstance;
  }

  private InstanceView saveFromView(InstanceView instanceView) {
    return instanceMapper.toView(instanceRepository.save(instanceMapper.fromView(instanceView)));
  }

  private List<InstanceView> listInstanceForCollectionId(
      CollectionView collectionView) {
    // TODO FIX
    return Collections.emptyList();
/*    return instanceRepository
        .findAllByCollectionVersionIdIn(
            collectionView.getVersionsList())
        .stream()
        .map(instanceMapper::toView)
        .collect(Collectors.toList());*/
  }

  @Override
  public SeekPage<InstanceView> listByProjectId(
          Ksuid projectId, SeekPageRequest request)
      throws PermissionDeniedException, InstanceNotFoundException {
    permissionService.requiresPermission(projectId, Permission.READ_INSTANCE);
    final List<PageFilter> filters = List.of(new PageFilter(Instance.PROJECT_ID, projectId));
    return instanceRepository.findPageAsc( filters, request).convert(instanceMapper::toView);
  }

  @Override
  public InstanceView create(CreateOrUpdateInstanceRequest request)
      throws PermissionDeniedException, ResourceNotFoundException,
          MissingConfigsException, CollectionVersionNotFoundException {
    permissionService.requiresPermission(request.getCollectionVersionId(), Permission.WRITE_INSTANCE);
    CollectionVersionView collectionVersion =
        collectionVersionService.get(request.getCollectionVersionId());
    Map<String, Object> validatedPieceConfigs = getPieceConfigs(collectionVersion, request);
    Instance metadata =
        Instance.builder()
            .collectionVersionId(request.getCollectionVersionId())
            .configs(validatedPieceConfigs)
            .status(request.getStatus())
            .build();

    metadata.setId(Ksuid.newKsuid());
    metadata.setConfigs(validatedPieceConfigs);
    metadata.setEpochCreationTime(Instant.now().toEpochMilli());
    metadata.setEpochUpdateTime(Instant.now().toEpochMilli());
    InstanceView savedView = instanceMapper.toView(instanceRepository.save(metadata));
    savedView = instanceMapper.toView(instanceRepository.save(instanceMapper.fromView(savedView)));

    permissionService.createResourceWithParent(
        savedView.getId(), savedView.getCollectionVersionId(), ResourceType.INSTANCE);

    instancePublisher.notify(InstanceEventType.CREATE, savedView);
    return savedView;
  }

  @Override
  public Optional<InstanceView> getOptional(Ksuid id) throws PermissionDeniedException {
    Optional<Instance> optional = instanceRepository.findById(id);
    if (optional.isEmpty()) {
      return Optional.empty();
    }
    permissionService.requiresPermission(id, Permission.READ_INSTANCE);
    return Optional.of(instanceMapper.toView(optional.get()));
  }

  @Override
  public InstanceView get(Ksuid id) throws PermissionDeniedException, InstanceNotFoundException {
    Optional<InstanceView> optional = getOptional(id);
    if (optional.isEmpty()) {
      throw new InstanceNotFoundException(id);
    }
    return optional.get();
  }


  @Override
  public InstanceView update(Ksuid id, CreateOrUpdateInstanceRequest request)
      throws PermissionDeniedException, MissingConfigsException, InstanceNotFoundException,
          CollectionVersionNotFoundException {
    Optional<Instance> optional = instanceRepository.findById(id);
    if (optional.isEmpty()) {
      throw new InstanceNotFoundException(id);
    }
    permissionService.requiresPermission(id, Permission.WRITE_INSTANCE);
    CollectionVersionView collectionVersion =
        collectionVersionService.get(request.getCollectionVersionId());
    Map<String, Object> validatedPieceConfigs = getPieceConfigs(collectionVersion, request);
    Instance entity = optional.get();
    entity.setConfigs(validatedPieceConfigs);
    entity.setStatus(request.getStatus());
    entity.setEpochUpdateTime(Instant.now().getEpochSecond());

    InstanceView instanceView = instanceMapper.toView(instanceRepository.save(entity));
    instancePublisher.notify(InstanceEventType.UPDATE, instanceView);
    return instanceView;
  }

  @Override
  public void delete(Ksuid id)
      throws PermissionDeniedException, ResourceNotFoundException, InstanceNotFoundException {
    if (!instanceRepository.existsById(id)) {
      throw new InstanceNotFoundException(id);
    }
    permissionService.requiresPermission(id, Permission.WRITE_INSTANCE);
    InstanceView view = get(id);
    instancePublisher.notify(InstanceEventType.DELETE, view);
    permissionService.deleteResourceAsync(id);
  }

  private Map<String, Object> getPieceConfigs(
      CollectionVersionView collectionVersionView, CreateOrUpdateInstanceRequest request)
      throws PermissionDeniedException, CollectionVersionNotFoundException,
          MissingConfigsException {
    return variableService.validateAndGetConfigs(
        collectionVersionView.getConfigs(), request.getConfigs());
  }
}

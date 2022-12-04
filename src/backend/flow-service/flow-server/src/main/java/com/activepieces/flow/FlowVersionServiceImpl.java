package com.activepieces.flow;

import com.activepieces.actions.code.CodeArtifactService;
import com.activepieces.cache.ConditionalCache;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.common.code.ArtifactMetadataSettings;
import com.activepieces.common.code.ArtifactReference;
import com.activepieces.common.error.exception.ConstraintsException;
import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.common.utils.TimeUtils;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.sql.FlowVersion;
import com.activepieces.flow.mapper.FlowVersionMapper;
import com.activepieces.flow.model.CreateFlowRequest;
import com.activepieces.flow.model.FlowVersionMetaView;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.repository.FlowVersionRepository;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.github.ksuid.Ksuid;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Log4j2
@Service
public class FlowVersionServiceImpl implements FlowVersionService {

  private final FlowVersionRepository flowVersionRepository;
  private final PermissionService permissionService;
  private final CodeArtifactService codeArtifactsService;
  private final FlowVersionMapper flowVersionMapper;
  private final ConditionalCache<Ksuid, Optional<FlowVersion>> conditionalCache;

  @Autowired
  public FlowVersionServiceImpl(
      final FlowVersionRepository flowVersionRepository,
      final PermissionService permissionService,
      final CodeArtifactService codeArtifactsService,
      final FlowVersionMapper flowVersionMapper) {
    Function<Ksuid, Optional<FlowVersion>> generatorFunction = flowVersionRepository::findById;
    Function<Optional<FlowVersion>, Boolean> cacheCondition =
        flowVersionOptional ->
            flowVersionOptional.isPresent()
                && flowVersionOptional.get().getState().equals(EditState.LOCKED);
    this.conditionalCache = new ConditionalCache<>(generatorFunction, cacheCondition);
    this.codeArtifactsService = codeArtifactsService;
    this.flowVersionMapper = flowVersionMapper;
    this.flowVersionRepository = flowVersionRepository;
    this.permissionService = permissionService;
  }

  public FlowVersionView createNew(Ksuid flowId, Ksuid previousVersionId, FlowVersionView newVersion)
      throws ResourceNotFoundException {
    Ksuid newVersionIUd = Ksuid.newKsuid();
    uploadArtifacts(newVersionIUd, previousVersionId, newVersion);
    FlowVersionView savedFlowVersion =
        saveFromView(
            newVersion.toBuilder()
                .flowId(flowId)
                .id(newVersionIUd)
                .state(EditState.DRAFT)
                .build());

    permissionService.createResourceWithParent(
        savedFlowVersion.getId(), savedFlowVersion.getFlowId(), ResourceType.FLOW_VERSION);
    return savedFlowVersion;
  }

  public FlowVersionView update(Ksuid flowVersionId, FlowVersionView newVersion)
      throws FlowVersionAlreadyLockedException, FlowVersionNotFoundException,
          PermissionDeniedException {
    FlowVersionView currentVersion = get(flowVersionId);
    if (currentVersion.getState().equals(EditState.LOCKED)) {
      throw new FlowVersionAlreadyLockedException(flowVersionId);
    }
    uploadArtifacts(flowVersionId, null, newVersion);
    return saveFromView(
        currentVersion.toBuilder()
            .trigger(newVersion.getTrigger())
            .errors(newVersion.getErrors())
            .valid(newVersion.isValid())
            .displayName(newVersion.getDisplayName())
            .state(
                Objects.isNull(newVersion.getState())
                    ? currentVersion.getState()
                    : newVersion.getState())
            .build());
  }

  @Override
  public FlowVersionView getLatest(Ksuid flowId) throws PermissionDeniedException {
    permissionService.requiresPermission(flowId, Permission.READ_FLOW);
    return flowVersionMapper.toView(flowVersionRepository.findFirstByFlowIdOrderByIdDesc(flowId));
  }

  @Override
  public Optional<FlowVersionView> getOptional(Ksuid id) throws PermissionDeniedException {
    Optional<FlowVersion> optional = conditionalCache.get(id);
    if (optional.isEmpty()) {
      return Optional.empty();
    }
    permissionService.requiresPermission(optional.get().getFlowId(), Permission.READ_FLOW);
    FlowVersionView flowVersionView = flowVersionMapper.toView(optional.get());
    return Optional.of(flowVersionView);
  }

  @Override
  public List<FlowVersionMetaView> listByFlowId(Ksuid flowId) throws PermissionDeniedException {
    List<FlowVersion> flowVersionMetaViews =
        flowVersionRepository.findAllByFlowIdOrderByCreated(flowId);
    if (!flowVersionMetaViews.isEmpty()) {
      permissionService.requiresPermission(flowVersionMetaViews.get(0).getFlowId(), Permission.READ_FLOW);
    }
    return flowVersionMetaViews.stream()
        .map(flow -> flowVersionMapper.toMeta(flowVersionMapper.toView(flow)))
        .collect(Collectors.toList());
  }



  @Override
  public FlowVersionView get(Ksuid id)
      throws FlowVersionNotFoundException, PermissionDeniedException {
    return getOptional(id).orElseThrow(() -> new FlowVersionNotFoundException(id));
  }

  @Override
  public void lock(Ksuid id)
      throws FlowVersionAlreadyLockedException, FlowVersionNotFoundException,
          PermissionDeniedException {
    FlowVersionView currentVersion = get(id);
    if (!currentVersion.isValid()) {
      throw new ConstraintsException(currentVersion.getErrors());
    }
    if (currentVersion.getState().equals(EditState.LOCKED)) {
      throw new FlowVersionAlreadyLockedException(id);
    }
    permissionService.requiresPermission(id, Permission.WRITE_FLOW);
    saveFromView(currentVersion.toBuilder().state(EditState.LOCKED).build());
  }

  // TODO FIX
  private void uploadArtifacts(
          Ksuid newFlowVersionId, Ksuid previousVersionId, FlowVersionView newVersion) {
/*    List<ArtifactMetadata> codeActionsWithArtifact =
        FlowVersionUtil.findAllActions(newVersion).stream()
            .filter(codeAction -> codeAction instanceof ArtifactMetadata)
            .map(action -> (ArtifactMetadata) action)
            .collect(Collectors.toUnmodifiableList());
    for (ArtifactMetadata action : codeActionsWithArtifact) {
      ArtifactMetadataSettings codeSettings = action.getArtifactSettings();
      ArtifactFile artifactFileToUpload = codeSettings.getNewArtifactToUploadFile();
      ArtifactReference reference =
          codeArtifactsService.handleFlowUpgrade(
              newFlowVersionId,
              previousVersionId,
              artifactFileToUpload,
              action,
              codeSettings.getArtifact(),
              codeSettings.getArtifactUrl());
      codeSettings.setArtifact(reference.getArtifact());
      codeSettings.setArtifactUrl(reference.getArtifactUrl());
    }*/
  }

  private FlowVersionView saveFromView(FlowVersionView FlowVersionView) {
    FlowVersion savedVersion =
        flowVersionRepository.save(flowVersionMapper.fromView(FlowVersionView));
    return flowVersionMapper.toView(savedVersion);
  }
}

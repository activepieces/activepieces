package com.activepieces.flow;

import com.activepieces.actions.model.action.CodeActionMetadataView;
import com.activepieces.actions.model.action.settings.CodeSettingsView;
import com.activepieces.cache.ConditionalCache;
import com.activepieces.common.error.exception.ConstraintsException;
import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.enums.Permission;
import com.activepieces.entity.enums.ResourceType;
import com.activepieces.entity.sql.FileEntity;
import com.activepieces.entity.sql.FlowVersion;
import com.activepieces.file.service.FileService;
import com.activepieces.flow.mapper.FlowVersionMapper;
import com.activepieces.flow.model.FlowVersionMetaView;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.repository.FlowVersionRepository;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.guardian.client.PermissionService;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ser.std.FileSerializer;
import com.github.ksuid.Ksuid;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Log4j2
@Service
public class FlowVersionServiceImpl implements FlowVersionService {

  private final FlowVersionRepository flowVersionRepository;
  private final PermissionService permissionService;
  private final FlowVersionMapper flowVersionMapper;
  private final FileService fileService;
  private final ConditionalCache<Ksuid, Optional<FlowVersion>> conditionalCache;

  @Autowired
  public FlowVersionServiceImpl(
      final FlowVersionRepository flowVersionRepository,
      final PermissionService permissionService,
      final FileService fileService,
      final FlowVersionMapper flowVersionMapper) {
    Function<Ksuid, Optional<FlowVersion>> generatorFunction = flowVersionRepository::findById;
    Function<Optional<FlowVersion>, Boolean> cacheCondition =
        flowVersionOptional ->
            flowVersionOptional.isPresent()
                && flowVersionOptional.get().getState().equals(EditState.LOCKED);
    this.fileService = fileService;
    this.conditionalCache = new ConditionalCache<>(generatorFunction, cacheCondition);
    this.flowVersionMapper = flowVersionMapper;
    this.flowVersionRepository = flowVersionRepository;
    this.permissionService = permissionService;
  }

  public FlowVersionView createNew(Ksuid flowId, FlowVersionView newVersion)
          throws ResourceNotFoundException, IOException {
    Ksuid newVersionIUd = Ksuid.newKsuid();
    newVersion = newVersion.toBuilder().id(newVersionIUd).build();
    newVersion = uploadArtifacts(newVersion, true);
    FlowVersionView savedFlowVersion =
        saveFromView(
            newVersion.toBuilder()
                .flowId(flowId)
                .state(EditState.DRAFT)
                .build());

    permissionService.createResourceWithParent(
        savedFlowVersion.getId(), savedFlowVersion.getFlowId(), ResourceType.FLOW_VERSION);
    return savedFlowVersion;
  }

  public FlowVersionView update(Ksuid flowVersionId, FlowVersionView newVersion)
          throws FlowVersionAlreadyLockedException, FlowVersionNotFoundException,
          PermissionDeniedException, IOException {
    FlowVersionView currentVersion = get(flowVersionId);
    if (currentVersion.getState().equals(EditState.LOCKED)) {
      throw new FlowVersionAlreadyLockedException(flowVersionId);
    }
    newVersion = uploadArtifacts(newVersion, false);
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
    FlowVersion flowVersion = flowVersionRepository.findFirstByFlowIdOrderByIdDesc(flowId);
    return flowVersionMapper.toView(flowVersion);
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
  public FlowVersionView persistPackagedFlow(FlowVersionView flowVersionView) {
    return saveFromView(flowVersionView);
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

  private FlowVersionView uploadArtifacts(final FlowVersionView newVersion,
                                          final boolean clone) throws IOException {
    final FlowVersionView clonedVersion = newVersion.toBuilder().build();
    List<CodeActionMetadataView> codeActionsWithArtifact =
        FlowVersionUtil.findCodeActions(clonedVersion);
    for (CodeActionMetadataView action : codeActionsWithArtifact) {
      final CodeSettingsView codeSettings = action.getSettings();

      if(clone){
        if(Objects.nonNull(codeSettings.getArtifactSourceId())){
          FileEntity clonedFile = fileService.clone(codeSettings.getArtifactSourceId());
          codeSettings.setArtifactSourceId(clonedFile.getId());

          if(Objects.nonNull(codeSettings.getArtifactPackagedId())){
            FileEntity packagedClonedFile = fileService.clone(codeSettings.getArtifactPackagedId());
            codeSettings.setArtifactPackagedId(packagedClonedFile.getId());
          }
        }
      }

      if(Objects.nonNull(codeSettings.getNewArtifactToUploadFile())){
        FileEntity file = fileService.save(codeSettings.getArtifactSourceId(), codeSettings.getNewArtifactToUploadFile().toMultiFile());
        codeSettings.setArtifactSourceId(file.getId());
        codeSettings.setArtifactPackagedId(null);
      }
    }
    return clonedVersion;
  }

  private FlowVersionView saveFromView(FlowVersionView FlowVersionView) {
    FlowVersion savedVersion =
        flowVersionRepository.save(flowVersionMapper.fromView(FlowVersionView));
    return flowVersionMapper.toView(savedVersion);
  }
}

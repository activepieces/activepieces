package com.activepieces.flow.controller;

import com.activepieces.action.FlowPublisherService;
import com.activepieces.actions.code.CodeArtifactService;
import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.error.exception.ConstraintsException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.error.exception.flow.FlowExecutionInternalError;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.common.pagination.Cursor;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.common.utils.TimeUtils;
import com.activepieces.flow.FlowService;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.CreateFlowRequest;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.model.FlowView;
import com.activepieces.flow.model.TestFlowRequest;
import com.activepieces.flow.validator.FlowVersionValidator;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.CollectionService;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import com.activepieces.variable.model.VariableService;
import com.activepieces.variable.model.exception.MissingConfigsException;
import com.github.ksuid.Ksuid;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.*;

@RestController
@Hidden
public class FlowController {

  private final FlowService flowService;
  private final FlowVersionService flowVersionService;
  private final CollectionService collectionService;
  private final FlowVersionValidator flowVersionValidator;
  private final CodeArtifactService codeArtifactService;
  private final VariableService variableService;
  private final FlowPublisherService flowPublisherService;
  private final CollectionVersionService collectionVersionService;

  @Autowired
  public FlowController(
      @NonNull final FlowService flowService,
      @NonNull final FlowVersionService flowVersionService,
      @NonNull final CodeArtifactService codeArtifactService,
      @NonNull final VariableService variableService,
      @NonNull final CollectionService collectionService,
      @NonNull final FlowPublisherService flowPublisherService,
      @NonNull final CollectionVersionService collectionVersionService,
      @NonNull final FlowVersionValidator flowVersionValidator) {
    this.flowService = flowService;
    this.flowPublisherService = flowPublisherService;
    this.collectionVersionService = collectionVersionService;
    this.codeArtifactService = codeArtifactService;
    this.variableService = variableService;
    this.flowVersionService = flowVersionService;
    this.collectionService = collectionService;
    this.flowVersionValidator = flowVersionValidator;
  }

  @GetMapping("/collections/{collectionId}/flows")
  public ResponseEntity<SeekPage<FlowView>> list(
      @PathVariable Ksuid collectionId,
      @RequestParam(value = "cursor", required = false) Cursor cursor,
      @RequestParam(value = "limit", defaultValue = "10", required = false) int limit)
      throws CollectionNotFoundException, PermissionDeniedException, FlowNotFoundException {
    return ResponseEntity.ok(
        flowService.listByCollectionId(
            collectionId, new SeekPageRequest(cursor, limit)));
  }

  @GetMapping("/flows/{flowId}")
  public ResponseEntity<FlowView> get(@PathVariable Ksuid flowId)
      throws FlowNotFoundException, PermissionDeniedException, CollectionNotFoundException {
    return ResponseEntity.ok(flowService.get(flowId));
  }

  @PostMapping("/collections/{collectionId}/flows")
  public ResponseEntity<FlowView> create(
      @PathVariable Ksuid collectionId,
      @RequestPart(value = "flow") @Valid CreateFlowRequest createFlowRequest,
      @RequestPart(value = "artifacts", required = false) MultipartFile[] files)
          throws Exception {
    List<MultipartFile> fileList =
        Objects.isNull(files) ? Collections.emptyList() : Arrays.asList(files);

    List<ArtifactFile> artifactFiles = codeArtifactService.toArtifacts(fileList);
    FlowVersionView finalRequest =
        flowVersionValidator.constructRequest(
            collectionId, null, createFlowRequest.getVersion(), artifactFiles);
    CollectionView collectionView = collectionService.get(collectionId);
    return ResponseEntity.ok(
        flowService.create(
            collectionView.getProjectId(),
            collectionId,
            createFlowRequest.toBuilder().version(finalRequest).build()));
  }

  @PostMapping("/flows/{flowId}/commit")
  public ResponseEntity<FlowView> commit(@PathVariable Ksuid flowId)
      throws FlowNotFoundException, PermissionDeniedException, FlowVersionNotFoundException,
          FlowVersionAlreadyLockedException {
    FlowView flowView = flowService.get(flowId);
    flowVersionService.lock(flowView.getLastVersion().getId());
    return ResponseEntity.ok(flowService.get(flowId));
  }

  @PutMapping(
      value = "/flows/{flowId}/versions/latest",
      consumes = {"multipart/form-data"})
  public ResponseEntity<FlowView> update(
      @PathVariable Ksuid flowId,
      @RequestPart("flow") @Valid FlowVersionView versionRequestBody,
      @RequestPart(value = "artifacts", required = false) MultipartFile[] files)
          throws Exception {
    long updateTime = TimeUtils.getEpochTimeInMillis();
    List<MultipartFile> fileList =
        (Objects.isNull(files) ? Collections.emptyList() : Arrays.asList(files));
    List<ArtifactFile> artifactFiles = codeArtifactService.toArtifacts(fileList);
    FlowVersionView constructedRequest =
        flowVersionValidator.constructRequest(null, flowId, versionRequestBody, artifactFiles);
    return ResponseEntity.ok(flowService.updateDraft(flowId, constructedRequest, updateTime));
  }

  @DeleteMapping("/flows/{flowId}")
  public ResponseEntity<FlowView> update(@PathVariable Ksuid flowId)
      throws FlowNotFoundException, PermissionDeniedException, ResourceNotFoundException {
    flowService.archive(flowId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/collection-versions/{collectionVersionId}/flow-versions/{flowVersionId}/runs")
  public ResponseEntity<InstanceRunView> execute(
      @PathVariable Ksuid collectionVersionId,
      @PathVariable Ksuid flowVersionId,
      @RequestBody @Valid TestFlowRequest request)
          throws PermissionDeniedException, FlowVersionNotFoundException, MissingConfigsException,
          FlowExecutionInternalError, CollectionVersionNotFoundException, ResourceNotFoundException {
    FlowVersionView flowVersionView = flowVersionService.get(flowVersionId);
    if (!flowVersionView.isValid()) {
      throw new ConstraintsException(flowVersionView.getErrors());
    }
    CollectionVersionView collectionVersionView = collectionVersionService.get(collectionVersionId);
    Map<String, Object> variablesList =
        variableService.validateAndGetConfigs(
            collectionVersionView.getConfigs(), request.getConfigs());

    InstanceRunView response =
        flowPublisherService.executeTest(
            collectionVersionId, flowVersionId, variablesList, request.getTrigger());

    return ResponseEntity.ok(response);
  }
}

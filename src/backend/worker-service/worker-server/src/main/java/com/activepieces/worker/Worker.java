package com.activepieces.worker;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.model.WorkerExecutionResult;
import com.activepieces.worker.service.LocalArtifactCacheServiceImpl;
import com.activepieces.worker.steps.*;
import com.activepieces.worker.workers.CodeBuildWorker;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.NonNull;
import lombok.extern.log4j.Log4j;
import lombok.extern.log4j.Log4j2;

import java.util.*;

@Getter
@Log4j2
public class Worker {

  private final int workerId;
  private final Sandbox sandbox;
  private final List<Step> steps = new ArrayList<>();
  private final String apiUrl;

  public Worker(
      int workerId,
      @NonNull final String apiUrl,
      @NonNull FlowVersionService flowVersionService,
      @NonNull LocalArtifactCacheServiceImpl localArtifactCacheService,
      @NonNull CollectionVersionService collectionVersionService,
      @NonNull InstanceRunService instanceRunService,
      @NonNull ObjectMapper objectMapper) {
    this.workerId = workerId;
    this.sandbox = new Sandbox(workerId);
    this.apiUrl = apiUrl;
    steps.add(new PrepareSandbox(this));
    steps.add(
        new DownloadRequiredFiles(
            this,
            apiUrl,
            localArtifactCacheService,
            objectMapper));
    steps.add(new ExecuteWorker(this, objectMapper));
    steps.add(new UploadRunState(instanceRunService));
  }

  public InstanceRunView run(
          InstanceRunView instanceRunView,
          CollectionVersionView collectionVersion,
          FlowVersionView flowVersion,
          Map<String, Object> configs,
          Map<String, Object> context,
          Map<String, Object> triggerPayload,
          StorePath storePath)
      throws Exception {
    long startTimeMs = System.currentTimeMillis();
    HashMap<String, Object> output = new HashMap<>();
    for (Step step : steps) {
      step.next(instanceRunView, collectionVersion, flowVersion, configs, triggerPayload, context, output, storePath);
    }
    log.info("Preparing Sandbox {} took {}ms", sandbox.getBoxId(), System.currentTimeMillis() - startTimeMs);
    return (InstanceRunView) output.get(Constants.RUN_RESULT_IN_MAP);
  }
}

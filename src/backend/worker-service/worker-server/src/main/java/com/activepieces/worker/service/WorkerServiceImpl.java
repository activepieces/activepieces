package com.activepieces.worker.service;

import com.activepieces.actions.code.CodeArtifactService;
import com.activepieces.actions.model.action.CodeActionMetadataView;
import com.activepieces.actions.store.model.StorePath;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.CodeArtifactBuildFailure;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.lockservice.LockService;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.Worker;
import com.activepieces.worker.model.WorkerExecutionResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
@Log4j2
public class WorkerServiceImpl implements WorkerService {

  private static final int NUMBER_OF_WORKERS = 64;

  private final ArrayList<Worker> workers;
  private final BlockingQueue<Integer> blockingQueue;

  @Autowired
  public WorkerServiceImpl(
          @Value("${com.activepieces.api-prefix}") final String apiUrl,
      final FlowVersionService flowVersionService,
      final InstanceRunService instanceRunService,
      final CollectionVersionService collectionVersionService,
      final LocalArtifactCacheServiceImpl localArtifactCacheService,
      final ObjectMapper objectMapper) {
    this.workers = new ArrayList<>();
    this.blockingQueue = new LinkedBlockingQueue<>();
    for (int i = 0; i < NUMBER_OF_WORKERS; ++i) {
      this.blockingQueue.add(i);
      this.workers.add(
          new Worker(
              i + 20,
                  apiUrl,
              flowVersionService,
              localArtifactCacheService,
              collectionVersionService,
              instanceRunService,
              objectMapper));
    }
  }

  /**
   * Step 1: Parse All code Actions. Step 2: Make sure all code actions are built and exists on
   * Google Cloud. Step 3: Download these files locally (If they don't exist already). Step 4:
   * Create Sandbox. Step 5: Bind these directories to Sandbox. Step 6: Execution flow with
   * Typescript worker.
   */
  public InstanceRunView executeFlow(
          InstanceRunView instanceRunView,
          CollectionVersionView collectionVersionView,
          FlowVersionView flowVersionView,
          Map<String, Object> configs,
          Map<String, Object> context,
          Map<String, Object> triggerPayload,
          StorePath storePath)
      throws Exception {
    InstanceRunView resultRun;
    int workerIndex = this.blockingQueue.take();
    log.debug(
        "Worker {} Started running flow Id {} with collectName {} and flowName {}", workerIndex, flowVersionView.getId().toString(), collectionVersionView.getDisplayName(), flowVersionView.getDisplayName());
    resultRun =
        this.workers
            .get(workerIndex)
            .run(instanceRunView, collectionVersionView, flowVersionView, configs, context, triggerPayload, storePath);

    this.blockingQueue.add(workerIndex);
    log.debug(
        "Worker {} Finished running flow Id {}", workerIndex, flowVersionView.getId().toString());
    return resultRun;
  }
}

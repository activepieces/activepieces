package com.activepieces.worker.steps;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.Constants;
import com.activepieces.worker.model.WorkerExecutionResult;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Log4j2
public class UploadRunState extends Step {

  private final InstanceRunService instanceRunService;

  public UploadRunState(@NonNull final InstanceRunService instanceRunService) {
    this.instanceRunService = instanceRunService;
  }

  @Override
  public void next(
          InstanceRunView instanceRun,
          CollectionVersionView collectionVersionView,
          FlowVersionView flowVersionView,
          Map<String, Object> input,
          Map<String, Object> triggerPayload,
          Map<String, Object> context,
          Map<String, Object> output,
          StorePath storePath)
      throws IOException, InstanceNotFoundException,
          PermissionDeniedException, ResourceNotFoundException {
    long startTime = System.currentTimeMillis();
    WorkerExecutionResult workerExecutionResult =
        (WorkerExecutionResult) output.get(Constants.WORKER_RESULT_IN_MAP);
    instanceRun.setStatus(workerExecutionResult.getStatus());
    instanceRun.setOutput(workerExecutionResult.getOutput());
    instanceRun.setFinishTime(Instant.now().toEpochMilli());
    output.put(
        Constants.RUN_RESULT_IN_MAP,
        instanceRunService.createOrUpdate(instanceRun, workerExecutionResult.getExecutionState()));
    log.info("Uploaded Run State {}ms", System.currentTimeMillis() - startTime);
  }
}

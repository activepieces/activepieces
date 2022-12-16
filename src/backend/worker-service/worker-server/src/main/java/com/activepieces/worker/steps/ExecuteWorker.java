package com.activepieces.worker.steps;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.common.Constants;
import com.activepieces.worker.Worker;
import com.activepieces.worker.model.WorkerExecutionResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Log4j2
public class ExecuteWorker extends Step {

  private final Worker worker;
  private final ObjectMapper objectMapper;

  public ExecuteWorker(
      @NonNull final Worker worker,
      @NonNull final ObjectMapper objectMapper) {
    this.worker = worker;
    this.objectMapper = objectMapper;
  }

  @Override
  public void next(
          InstanceRunView instanceRunView,
          CollectionVersionView collectionVersionView,
          FlowVersionView flowVersionView,
          Map<String, Object> input,
          Object triggerPayload,
          Map<String, Object> output,
          StorePath storePath) throws IOException, InterruptedException {
    long startTime = System.currentTimeMillis();
    worker.getSandbox().runJsFile(Constants.ACTIVEPIECES_WORKER_JS, Constants.WORKER_EXECUTE_FLOW_ARG);
    File outputFile = new File(worker.getSandbox().getSandboxFilePath(Constants.WORKER_OUTPUT_FILE));
    output.put(Constants.WORKER_RESULT_IN_MAP,objectMapper.readValue(outputFile, WorkerExecutionResult.class));
    log.info("Execution Time took {}ms", System.currentTimeMillis() - startTime);
  }

}

package com.activepieces.flow;

import com.activepieces.action.ExecutionRequest;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.service.WorkerService;
import lombok.extern.log4j.Log4j2;
import org.jboss.logging.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Log4j2
public class FlowScheduler {

  private final ErrorServiceHandler errorServiceHandler;

  private final FlowVersionService flowVersionService;

  private final CollectionVersionService collectionVersionService;
  private final WorkerService workerService;
  private final InstanceRunService instanceRunService;
  private final String mdcHeader;
  private final String loggingRunPattern;

  @Autowired
  FlowScheduler(
          final ErrorServiceHandler errorServiceHandler,
          final WorkerService workerService,
          final CollectionVersionService collectionVersionService,
          final InstanceRunService instanceRunService,
          final FlowVersionService flowVersionService,
          @Value("${logging.request-id-header}") String mdcHeader,
          @Value("${logging.run-pattern}") String loggingRunPattern) {
    this.mdcHeader = mdcHeader;
    this.workerService = workerService;
    this.instanceRunService = instanceRunService;
    this.collectionVersionService = collectionVersionService;
    this.flowVersionService = flowVersionService;
    this.loggingRunPattern = loggingRunPattern;
    this.errorServiceHandler = errorServiceHandler;

  }

  @Async
  public void executeFlowAsync(ExecutionRequest request){
    try {
      MDC.put(mdcHeader, String.format(loggingRunPattern, request.getRunId().toString()));
      long startTime = System.currentTimeMillis();
      log.info("[Started] Executing Message " + request);

      FlowVersionView flowVersionView = flowVersionService.get(request.getFlowVersionId());
      CollectionVersionView collectionVersionView = collectionVersionService.get(request.getCollectionVersionId());
      InstanceRunView instanceRunView = instanceRunService.get(request.getRunId());
      workerService.executeFlow(
              instanceRunView,
              collectionVersionView,
              flowVersionView,
              request.getConfigs(),
              request.getContext(),
              request.getTriggerPayload(),
              request.getStorePath());
      log.info(
              "[Finished] Executing Message "
                      + request
                      + " "
                      + (System.currentTimeMillis() - startTime)
                      + "ms");
    } catch (Exception e) {
      e.printStackTrace();
      throw errorServiceHandler.createInternalError(FlowScheduler.class, e);
    }
  }
}

package com.activepieces.flow;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.worker.service.WorkerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Log4j2
public class FlowSubscriberService {

  @Autowired
  FlowSubscriberService(
      final ObjectMapper objectMapper,
      final ErrorServiceHandler errorServiceHandler,
      final WorkerService workerService,
      final InstanceRunService instanceRunService,
      final FlowVersionService flowVersionService,
      @Value("${logging.request-id-header}") String mdcHeader,
      @Value("${logging.run-pattern}") String loggingRunPattern) {


    // TODO FIX
/*    MessageReceiver receiver =
        (message, consumer) -> {
          try {
            ExecutionRequest request =
                objectMapper.readValue(message.getData().toStringUtf8(), ExecutionRequest.class);
            MDC.put(mdcHeader, String.format(loggingRunPattern, request.getRunId().toString()));
            long startTime = System.currentTimeMillis();
            log.info("[Started] Executing Message " + request);

            FlowVersionView flowVersionView = flowVersionService.get(request.getFlowVersionId());
            // TODO FIX
            CollectionVersionView collectionVersionView = null;*//*
                collectionVersionService.get(request.getPieceVersionId());*//*
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
            consumer.ack();
          } catch (Exception e) {
            e.printStackTrace();
            consumer.nack();
            throw errorServiceHandler.createInternalError(FlowSubscriberService.class, e);
          }
        };

    ExecutorProvider executorProvider =
        InstantiatingExecutorProvider.newBuilder().setExecutorThreadCount(8).build();

    Subscriber subscriber =
        Subscriber.newBuilder(subscriptionName, receiver)
            .setCredentialsProvider(credentialsProvider)
            .setParallelPullCount(4)
            .setExecutorProvider(executorProvider)
            .build();
    subscriber.startAsync();
    log.info("Subscriber Started and Created " + subscriptionName);*/
  }
}

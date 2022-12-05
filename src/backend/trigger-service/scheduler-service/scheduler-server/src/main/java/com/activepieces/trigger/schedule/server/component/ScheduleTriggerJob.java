package com.activepieces.trigger.schedule.server.component;

import com.activepieces.action.FlowPublisherService;
import com.activepieces.common.error.ErrorServiceHandler;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;

@Component
public class ScheduleTriggerJob extends QuartzJobBean {

  private static final Logger logger = LoggerFactory.getLogger(ScheduleTriggerJob.class);
  public static final String INSTANCE_ID = "instanceId";
  public static final String FLOW_VERSION_ID = "flowVersionId";

  private final FlowPublisherService flowExecutionPublisher;
  private final ErrorServiceHandler errorServiceHandler;

  @Autowired
  public ScheduleTriggerJob(
      @NonNull final FlowPublisherService flowExecutionPublisher,
      @NonNull final ErrorServiceHandler errorServiceHandler) {
    this.flowExecutionPublisher = flowExecutionPublisher;
    this.errorServiceHandler = errorServiceHandler;
  }

  @Override
  protected void executeInternal(JobExecutionContext jobExecutionContext) {
    JobDataMap jobDataMap = jobExecutionContext.getJobDetail().getJobDataMap();
    Ksuid instanceId = (Ksuid) jobDataMap.get(INSTANCE_ID);
    Ksuid flowVersionId = (Ksuid) jobDataMap.get(FLOW_VERSION_ID);
    logger.debug(
        "Executing Job with key {} instance id {}",
        jobExecutionContext.getJobDetail().getKey(),
        instanceId);
    try {
        flowExecutionPublisher.executeInstance(
            instanceId, flowVersionId, Collections.emptyMap(), true);
    } catch (Exception e) {
      throw errorServiceHandler.createInternalError(e);
    }

    logger.debug(
        "Finished Job with key {} instance id {}",
        jobExecutionContext.getJobDetail().getKey(),
        instanceId);
  }
}

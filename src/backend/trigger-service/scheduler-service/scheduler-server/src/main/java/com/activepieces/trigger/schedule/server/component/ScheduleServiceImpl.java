package com.activepieces.trigger.schedule.server.component;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.entity.enums.InstanceStatus;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.instance.client.InstancePublisher;
import com.activepieces.instance.client.InstanceSubscriber;
import com.activepieces.instance.client.model.InstanceEventType;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.piece.client.CollectionVersionService;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.trigger.model.ScheduleMetadataTriggerView;
import com.activepieces.trigger.schedule.client.Job;
import com.activepieces.trigger.schedule.client.ScheduleService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

import static org.quartz.CronScheduleBuilder.cronSchedule;

@Service
@Log4j2
public class ScheduleServiceImpl implements ScheduleService, InstanceSubscriber {

  private final Scheduler scheduler;
  private final FlowVersionService flowVersionService;
  private final ErrorServiceHandler errorServiceHandler;

  private final CollectionVersionService collectionVersionService;

  @Autowired
  public ScheduleServiceImpl(
          @NonNull final Scheduler scheduler,
          @NonNull final FlowVersionService flowVersionService,
          @NonNull final InstancePublisher instancePublisher,
          @NonNull final CollectionVersionService collectionVersionService,
          @NonNull final ErrorServiceHandler errorServiceHandler) {
    instancePublisher.addSubscriber(this);
    this.scheduler = scheduler;
    this.errorServiceHandler = errorServiceHandler;
    this.collectionVersionService = collectionVersionService;
    this.flowVersionService = flowVersionService;
  }

  public Job create(InstanceView view, Ksuid flowVersionId, ScheduleMetadataTriggerView triggerView)
      throws SchedulerException, FlowVersionNotFoundException,
          PermissionDeniedException {
    FlowVersionView flowVersionView = flowVersionService.get(flowVersionId);
    JobDetail jobDetail =
        basicJobDetails(
            view.getId(), flowVersionView.getFlowId(), buildJobDataMap(view, flowVersionId));
    Trigger trigger = buildJobTrigger(jobDetail, triggerView);
    scheduler.scheduleJob(jobDetail, trigger);
    log.info(
        String.format(
            "Created Job for instanceId=%s for versionId %s with next fire %s",
            view.getId(), flowVersionId, trigger.getNextFireTime().toString()));
    return Job.builder()
        .id(jobDetail.getKey().getName())
        .nextFireTime(trigger.getNextFireTime().toInstant())
        .build();
  }

  @Override
  public Job get(String id) throws SchedulerException {
    Trigger trigger = scheduler.getTrigger(new TriggerKey(id));
    return Job.builder().id(id).nextFireTime(trigger.getNextFireTime().toInstant()).build();
  }

  private JobDataMap buildJobDataMap(InstanceView instanceView, Ksuid flowVersionId) {
    JobDataMap jobDataMap = new JobDataMap();
    jobDataMap.put(ScheduleTriggerJob.INSTANCE_ID, instanceView.getId());
    jobDataMap.put(ScheduleTriggerJob.FLOW_VERSION_ID, flowVersionId);
    return jobDataMap;
  }

  private String key(Ksuid instanceId, Ksuid flowId) {
    return String.format("%s_%s", instanceId.toString(), flowId.toString());
  }

  private JobDetail basicJobDetails(Ksuid instanceId, Ksuid flowId, JobDataMap jobDataMap) {
    return JobBuilder.newJob(ScheduleTriggerJob.class)
        .withIdentity(key(instanceId, flowId))
        .usingJobData(jobDataMap)
        .storeDurably()
        .build();
  }

  private Trigger buildJobTrigger(JobDetail jobDetail, ScheduleMetadataTriggerView trigger) {
    return TriggerBuilder.newTrigger()
        .forJob(jobDetail)
        .withIdentity(jobDetail.getKey().getName())
        .withSchedule(
            cronSchedule(trigger.getSettings().getCronExpression())
                .withMisfireHandlingInstructionDoNothing())
        .build();
  }

  private void createIfSchedule(InstanceView entity)
          throws PermissionDeniedException, SchedulerException, JsonProcessingException,
          FlowVersionNotFoundException, CollectionVersionNotFoundException {
  // TODO FIX
    /*    final CollectionVersionView collectionView = collectionVersionService.get(entity.getCollectionVersionId());
    for (UUID flowVersionId : collectionView.getFlowsVersionId()) {
      FlowVersionView flowVersion = flowVersionService.getOptional(flowVersionId).orElseThrow();
      if (flowVersion.getTrigger() instanceof ScheduleMetadataTriggerView) {
        log.info("Creating Schedule Job binding" + entity);
        create(entity, flowVersionId, (ScheduleMetadataTriggerView) flowVersion.getTrigger());
      }
    }*/
  }

  private void deleteSchedule(InstanceView entity)
          throws PermissionDeniedException, SchedulerException, FlowVersionNotFoundException, CollectionVersionNotFoundException {
    // TODO FIX
    /*    final CollectionVersionView collectionView = collectionVersionService.get(entity.getCollectionVersionId());
    for (UUID flowVersionId : collectionView.getFlowsVersionId()) {
      FlowVersionView flowVersionView = flowVersionService.get(flowVersionId);
      JobKey jobKey = new JobKey(key(entity.getId(), flowVersionView.getFlowId()));
      if (scheduler.checkExists(jobKey)) {
        log.info(String.format("Deleted Job for triggerId=%s ", entity.getId()));
        scheduler.deleteJob(jobKey);
      }
    }*/
  }

  @Override
  public void onListen(InstanceEventType type, InstanceView entity) {
    try {
      switch (type) {
        case CREATE:
          if (entity.getStatus().equals(InstanceStatus.RUNNING)) {
            log.info("Creating Schedule Job binding" + entity);
            createIfSchedule(entity);
          }
          break;
        case DELETE:
          deleteSchedule(entity);
          break;
        case UPDATE:
          log.info("Updating Schedule Job binding" + entity.toString());
          deleteSchedule(entity);
          if (entity.getStatus().equals(InstanceStatus.RUNNING)) {
            createIfSchedule(entity);
          }
          break;
        default:
          break;
      }
    } catch (SchedulerException | PermissionDeniedException | JsonProcessingException | FlowVersionNotFoundException |
             CollectionVersionNotFoundException e) {
      throw errorServiceHandler.createInternalError(e);
    }
  }
}

package com.activepieces.trigger.schedule.server.component;

import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.component.ComponentService;
import com.activepieces.entity.enums.ComponentTriggerType;
import com.activepieces.entity.enums.InstanceStatus;
import com.activepieces.flow.FlowVersionService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.instance.client.InstancePublisher;
import com.activepieces.instance.client.InstanceSubscriber;
import com.activepieces.instance.client.model.InstanceEventType;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.trigger.model.ComponentTriggerMetadataView;
import com.activepieces.trigger.model.ScheduleMetadataTriggerView;
import com.activepieces.trigger.model.TriggerMetadataView;
import com.activepieces.trigger.schedule.client.Job;
import com.activepieces.trigger.schedule.client.ScheduleService;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Objects;

import static org.quartz.CronScheduleBuilder.cronSchedule;

@Service
@Log4j2
public class ScheduleServiceImpl implements ScheduleService, InstanceSubscriber {

  private final Scheduler scheduler;
  private final FlowVersionService flowVersionService;
  private final ErrorServiceHandler errorServiceHandler;
  private final ComponentService componentService;

  @Autowired
  public ScheduleServiceImpl(
          @NonNull final Scheduler scheduler,
          @NonNull final FlowVersionService flowVersionService,
          @NonNull final InstancePublisher instancePublisher,
          @NonNull final ComponentService componentService,
          @NonNull final ErrorServiceHandler errorServiceHandler) {
    instancePublisher.addSubscriber(this);
    this.scheduler = scheduler;
    this.componentService = componentService;
    this.errorServiceHandler = errorServiceHandler;
    this.flowVersionService = flowVersionService;
  }

  public Job create(InstanceView view, Ksuid flowVersionId, final String cronExpression)
      throws SchedulerException, FlowVersionNotFoundException,
          PermissionDeniedException {
    FlowVersionView flowVersionView = flowVersionService.get(flowVersionId);
    JobDetail jobDetail =
        basicJobDetails(
            view.getId(), flowVersionView.getFlowId(), buildJobDataMap(view, flowVersionId));
    Trigger trigger = buildJobTrigger(jobDetail, cronExpression);
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

  private Trigger buildJobTrigger(final JobDetail jobDetail,
                                  final String cronExpression) {
    return TriggerBuilder.newTrigger()
        .forJob(jobDetail)
        .withIdentity(jobDetail.getKey().getName())
        .withSchedule(
            cronSchedule(cronExpression)
                .withMisfireHandlingInstructionDoNothing())
        .build();
  }

  private String getCronExpression(final TriggerMetadataView triggerMetadataView) throws IOException, InterruptedException {
    if(triggerMetadataView instanceof ScheduleMetadataTriggerView){
      return ((ScheduleMetadataTriggerView) triggerMetadataView).getSettings().getCronExpression();
    }
    if(triggerMetadataView instanceof ComponentTriggerMetadataView){
      ComponentTriggerMetadataView componentTrigger = (ComponentTriggerMetadataView) triggerMetadataView;
      final ComponentTriggerType triggerType = componentService.getTriggerType(
              componentTrigger.getSettings().getComponentName(), componentTrigger.getSettings().getTriggerName()
      );
      if(triggerType.equals(ComponentTriggerType.POLLING)){
        final String fifteenMinutes = "0 */15 * ? * *";
        return fifteenMinutes;
      }
    }
    return null;
  }
  private void createIfSchedule(InstanceView entity)
          throws PermissionDeniedException, SchedulerException, IOException,
          FlowVersionNotFoundException, CollectionVersionNotFoundException, InterruptedException {
    for (Ksuid flowVersionId : entity.getFlowVersionId().values()) {
      final FlowVersionView flowVersion = flowVersionService.getOptional(flowVersionId).orElseThrow();
      final String cronExpression = getCronExpression(flowVersion.getTrigger());
      if (Objects.nonNull(cronExpression)){
        log.info("Creating Schedule Job binding" + entity);
        create(entity, flowVersionId, cronExpression);
      }
    }
  }

  private void deleteSchedule(InstanceView entity)
          throws PermissionDeniedException, SchedulerException, FlowVersionNotFoundException, CollectionVersionNotFoundException {
    for (Ksuid flowVersionId : entity.getFlowVersionId().values()) {
      FlowVersionView flowVersionView = flowVersionService.get(flowVersionId);
      JobKey jobKey = new JobKey(key(entity.getId(), flowVersionView.getFlowId()));
      if (scheduler.checkExists(jobKey)) {
        log.info(String.format("Deleted Job for triggerId=%s ", entity.getId()));
        scheduler.deleteJob(jobKey);
      }
    }
  }

  @Override
  public void onListen(InstanceEventType type, InstanceView entity) {
    try {
      switch (type) {
        case CREATE:
          if (entity.getStatus().equals(InstanceStatus.ENABLED)) {
            createIfSchedule(entity);
          }
          break;
        case DELETE:
          deleteSchedule(entity);
          break;
        case UPDATE:
          log.info("Updating Schedule Job binding" + entity.toString());
          deleteSchedule(entity);
          if (entity.getStatus().equals(InstanceStatus.ENABLED)) {
            createIfSchedule(entity);
          }
          break;
        default:
          break;
      }
    } catch (SchedulerException | PermissionDeniedException | FlowVersionNotFoundException | CollectionVersionNotFoundException | IOException | InterruptedException e) {
      throw errorServiceHandler.createInternalError(e);
    }
  }
}

package com.activepieces.trigger.mapper;

import com.activepieces.actions.mapper.ActionMapper;
import com.activepieces.entity.subdocuments.trigger.*;
import com.activepieces.trigger.model.*;
import org.mapstruct.Mapper;
import org.mapstruct.SubclassMapping;
import org.mapstruct.SubclassMappings;

import static org.mapstruct.SubclassExhaustiveStrategy.RUNTIME_EXCEPTION;

@Mapper(
    subclassExhaustiveStrategy = RUNTIME_EXCEPTION,
    componentModel = "spring",
    uses = {ActionMapper.class})
public abstract class TriggerMapper {

  @SubclassMappings(
      value = {
        @SubclassMapping(
            source = ScheduleTriggerMetadata.class,
            target = ScheduleMetadataTriggerView.class),
        @SubclassMapping(
            source = ManualTriggerMetadata.class,
            target = ManualTriggerMetadataView.class),
        @SubclassMapping(
            source = InstanceStoppedTriggerMetadata.class,
            target = InstanceStoppedTriggerMetadataView.class),
        @SubclassMapping(
            source = InstanceStartedTriggerMetadata.class,
            target = InstanceStartedTriggerMetadataView.class),
        @SubclassMapping(
            source = WebhookTriggerMetadata.class,
            target = WebhookTriggerMetadataView.class),
        @SubclassMapping(
            source = WebhookTriggerMetadata.class,
            target = WebhookTriggerMetadataView.class),
        @SubclassMapping(
            source = EmptyTriggerMetadata.class,
            target = EmptyTriggerMetadataView.class)
      })
  public abstract TriggerMetadataView toView(TriggerMetadata entity);

  @SubclassMappings(
      value = {
        @SubclassMapping(
            source = ScheduleMetadataTriggerView.class,
            target = ScheduleTriggerMetadata.class),
        @SubclassMapping(
            source = InstanceStoppedTriggerMetadataView.class,
            target = InstanceStoppedTriggerMetadata.class),
        @SubclassMapping(
            source = InstanceStartedTriggerMetadataView.class,
            target = InstanceStartedTriggerMetadata.class),
        @SubclassMapping(
            source = WebhookTriggerMetadataView.class,
            target = WebhookTriggerMetadata.class),
        @SubclassMapping(
            source = ManualTriggerMetadataView.class,
            target = ManualTriggerMetadata.class),
        @SubclassMapping(
            source = EmptyTriggerMetadataView.class,
            target = EmptyTriggerMetadata.class)
      })
  public abstract TriggerMetadata fromView(TriggerMetadataView entity);
}

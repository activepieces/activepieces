package com.activepieces.flow.mapper;

import com.activepieces.entity.nosql.FlowVersion;
import com.activepieces.entity.subdocuments.trigger.TriggerMetadata;
import com.activepieces.flow.model.FlowVersionMetaView;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.trigger.mapper.TriggerMapper;
import com.activepieces.trigger.model.TriggerMetadataView;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.springframework.beans.factory.annotation.Autowired;


@Mapper(componentModel = "spring")
public abstract class FlowVersionMapper {

  @Autowired private TriggerMapper triggerMapper;

  @Mappings({
    @Mapping(target = "trigger", expression = "java(mapTrigger(entity))"),
  })
  public abstract FlowVersion fromView(FlowVersionView entity);

  @Mappings({})
  public abstract FlowVersionMetaView toMeta(FlowVersionView entity);

  @FlowVersionToView
  @Mappings({
    @Mapping(target = "trigger", expression = "java(mapTrigger(entity))"),
  })
  public abstract FlowVersionView toView(FlowVersion entity);

  public TriggerMetadataView mapTrigger(FlowVersion flowVersion) {
    return triggerMapper.toView(flowVersion.getTrigger());
  }

  public TriggerMetadata mapTrigger(FlowVersionView flowVersion) {
    return triggerMapper.fromView(flowVersion.getTrigger());
  }


}

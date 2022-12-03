package com.activepieces.trigger.schedule.client;

import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.trigger.model.ScheduleMetadataTriggerView;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.quartz.SchedulerException;

import java.util.UUID;

public interface ScheduleService {

    Job get(String id) throws SchedulerException;

}

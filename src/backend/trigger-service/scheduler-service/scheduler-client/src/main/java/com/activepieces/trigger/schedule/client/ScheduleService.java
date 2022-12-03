package com.activepieces.trigger.schedule.client;

import org.quartz.SchedulerException;

public interface ScheduleService {

    Job get(String id) throws SchedulerException;

}

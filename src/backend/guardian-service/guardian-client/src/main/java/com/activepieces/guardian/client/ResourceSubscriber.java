package com.activepieces.guardian.client;

import com.activepieces.common.Subscriber;
import com.activepieces.entity.sql.Resource;
import com.activepieces.guardian.client.model.ResourceEventType;

public interface ResourceSubscriber extends Subscriber<ResourceEventType, Resource> {

}

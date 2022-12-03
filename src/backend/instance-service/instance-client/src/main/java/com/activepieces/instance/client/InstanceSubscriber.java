package com.activepieces.instance.client;

import com.activepieces.common.Subscriber;
import com.activepieces.instance.client.model.InstanceEventType;
import com.activepieces.instance.client.model.InstanceView;

public interface InstanceSubscriber extends Subscriber<InstanceEventType, InstanceView> {

}

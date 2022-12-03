package com.activepieces.instance.client;

import com.activepieces.common.Publisher;
import com.activepieces.instance.client.InstanceSubscriber;
import com.activepieces.instance.client.model.InstanceEventType;
import com.activepieces.instance.client.model.InstanceView;
import lombok.NonNull;

import java.util.List;


public class InstancePublisher extends Publisher<InstanceEventType, InstanceView> {

    public InstancePublisher(){}

}

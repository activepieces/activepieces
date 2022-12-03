package com.activepieces.guardian.server;

import com.activepieces.common.Publisher;
import com.activepieces.entity.sql.Resource;
import com.activepieces.guardian.client.ResourceSubscriber;
import com.activepieces.guardian.client.model.ResourceEventType;
import lombok.NonNull;

import java.util.List;


public class ResourcePublisher extends Publisher<ResourceEventType, Resource> {

    public ResourcePublisher(@NonNull final List<ResourceSubscriber> subscriberList){
        for(ResourceSubscriber subscriber: subscriberList){
            addSubscriber(subscriber);
        }
    }

}

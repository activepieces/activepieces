package com.activepieces.common;

import lombok.extern.log4j.Log4j2;

import java.util.ArrayList;
import java.util.List;

@Log4j2
public abstract class Publisher<E extends Enum<E>, T>{

    private final List<Subscriber<E,T>> subscriberList = new ArrayList<>();

    public void addSubscriber(Subscriber<E,T> subscriber){
        subscriberList.add(subscriber);
    }

    public void removeSubscriber(Subscriber<E,T> subscriber){
        subscriberList.remove(subscriber);
    }

    public void notify(E type, T entity){
        log.info("Notify subscribers");
        for(Subscriber<E,T> subscriber: subscriberList){
            subscriber.onListen(type,entity);
        }
    }

}

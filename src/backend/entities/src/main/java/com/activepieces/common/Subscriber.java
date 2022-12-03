package com.activepieces.common;

public interface Subscriber<E extends Enum<E>, T>{

    void onListen(E type, T entity);

}

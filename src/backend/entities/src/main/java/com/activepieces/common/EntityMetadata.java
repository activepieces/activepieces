package com.activepieces.common;

import com.github.ksuid.Ksuid;

import java.util.UUID;

public interface EntityMetadata {

    Ksuid getId();

    long getCreated();

    long getUpdated();


}

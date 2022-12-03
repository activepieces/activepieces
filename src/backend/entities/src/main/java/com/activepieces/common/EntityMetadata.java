package com.activepieces.common;

import java.util.UUID;

public interface EntityMetadata {

    UUID getId();

    long getEpochCreationTime();

    long getEpochUpdateTime();


}

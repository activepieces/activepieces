package com.activepieces.common;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Setter
@Getter
@Builder
public class AggregateKey {

    private final String aggregateKey;
    private final UUID value;

}

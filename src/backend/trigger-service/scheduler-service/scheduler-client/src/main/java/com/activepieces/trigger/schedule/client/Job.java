package com.activepieces.trigger.schedule.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class Job {

    @JsonProperty
    private Instant nextFireTime;

    @JsonProperty
    private String id;


}

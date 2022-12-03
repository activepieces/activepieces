package com.activepieces.action;

import com.activepieces.actions.store.model.StorePath;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ExecutionRequest {

    @JsonProperty
    private Ksuid runId;

    @JsonProperty
    private Ksuid instanceId;

    @JsonProperty
    private Ksuid flowVersionId;

    @JsonProperty
    private StorePath storePath;

    @JsonProperty
    private Map<String, Object> context;

    @JsonProperty
    private Map<String, Object> configs;

    @JsonProperty
    private Map<String, Object> triggerPayload;

}

package com.activepieces.action;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    private UUID runId;

    @JsonProperty
    private UUID instanceId;

    @JsonProperty
    private UUID flowVersionId;

    @JsonProperty
    private StorePath storePath;

    @JsonProperty
    private Map<String, Object> context;

    @JsonProperty
    private Map<String, Object> configs;

    @JsonProperty
    private Map<String, Object> triggerPayload;

}

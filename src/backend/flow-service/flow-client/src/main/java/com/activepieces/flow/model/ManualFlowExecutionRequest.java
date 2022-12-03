package com.activepieces.flow.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualFlowExecutionRequest {

    @JsonProperty
    @NotNull
    private UUID flowId;

    @JsonProperty
    private Boolean async;

    @JsonProperty
    @NotNull
    private UUID collectionId;

    @JsonProperty
    Map<String, Object> flowConfigs;

    @JsonProperty
    @NotNull
    Map<String, Object> payload;

}

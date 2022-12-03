package com.activepieces.flow.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
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
    private Ksuid flowId;

    @JsonProperty
    private Boolean async;

    @JsonProperty
    @NotNull
    private Ksuid collectionId;

    @JsonProperty
    Map<String, Object> flowConfigs;

    @JsonProperty
    @NotNull
    Map<String, Object> payload;

}

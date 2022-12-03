package com.activepieces.flow;

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
    @NotNull
    private Ksuid collectionId;

    @JsonProperty
    @NotNull
    Map<String, Object> payload;

}

package com.activepieces.worker.model;

import com.activepieces.entity.enums.FlowExecutionStatus;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.activepieces.entity.subdocuments.runs.StepOutput;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class WorkerExecutionResult {

  @JsonProperty private FlowExecutionStatus status;

  @JsonProperty private long duration;

  @JsonProperty private Object output;

  @JsonInclude(JsonInclude.Include.NON_NULL)
  @JsonProperty
  private Object errorMessage;

  @JsonProperty private ExecutionStateView executionState;
}

package com.activepieces.worker.model;

import com.activepieces.entity.subdocuments.runs.StepOutput;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@ToString
public class ExecutionCodeResult extends StepOutput {

    @JsonProperty
    private CodeExecutionStatusEnum verdict;

    @JsonProperty
    private double timeInSeconds;

    @JsonProperty
    private String standardOutput;

}

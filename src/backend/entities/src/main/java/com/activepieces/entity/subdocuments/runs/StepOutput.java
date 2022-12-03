package com.activepieces.entity.subdocuments.runs;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.util.LinkedHashMap;
import java.util.List;

@Getter
@Setter
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class StepOutput {

  public static final String OUTPUT_FIELD = "output";
  public static final String ERROR_FIELD = "errorMessage";

  @NotNull
  @JsonProperty
  private Object output;

  @NotNull
  @JsonProperty
  private List<LinkedHashMap<String, StepOutput>> iterations;

  @NotNull
  @JsonProperty
  private Object input;

  @JsonProperty private long duration;

  @JsonProperty()
  private ActionExecutionStatus status;

  @JsonInclude(JsonInclude.Include.NON_NULL)
  @JsonProperty
  private Object errorMessage;
}

package com.activepieces.entity.subdocuments.runs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExecutionStateView {

  @JsonProperty private Map<String, Object> context;

  @JsonProperty
  private Map<String, Object> configs;

  @JsonProperty private LinkedHashMap<String, StepOutput> steps;



}

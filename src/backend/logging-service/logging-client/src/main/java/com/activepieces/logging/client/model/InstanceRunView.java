package com.activepieces.logging.client.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.FlowExecutionStatus;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.*;

import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
@Setter
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class InstanceRunView implements EntityMetadata {

  @JsonProperty private Ksuid id;

  @JsonProperty private Ksuid projectId;

  @JsonProperty private Ksuid instanceId;

  @JsonProperty private Ksuid flowVersionId;

  @JsonProperty private Ksuid collectionVersionId;

  @JsonProperty private String flowDisplayName;

  @JsonProperty private String collectionDisplayName;

  @JsonProperty private String accountName;

  @JsonProperty private FlowExecutionStatus status;

  @JsonProperty private boolean logsUploaded;

  @JsonProperty private String stateUrl;

  @JsonProperty private long epochFinishTime;

  @JsonProperty private long epochStartTime;


  @JsonInclude(JsonInclude.Include.NON_NULL)
  @JsonProperty private ExecutionStateView state;

  @NotNull
  @JsonProperty
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private Object output;

  @JsonProperty
  @JsonInclude(JsonInclude.Include.NON_NULL)
  private Object errorMessage;


  @JsonIgnore private long epochCreationTime;

  @JsonIgnore private long epochUpdateTime;
}

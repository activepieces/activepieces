package com.activepieces.instance.client.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.InstanceStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@NoArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
public class InstanceView implements EntityMetadata {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UUID id;

  @JsonProperty private UUID projectId;

  @JsonProperty private UUID collectionVersionId;

  @JsonProperty private Map<String, Object> configs;

  @JsonProperty private InstanceStatus status;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochCreationTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochUpdateTime;
}

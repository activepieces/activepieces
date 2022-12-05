package com.activepieces.instance.client.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.InstanceStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@NoArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
public class InstanceView implements EntityMetadata {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private Ksuid id;

  @JsonProperty private Ksuid projectId;

  @JsonProperty private Ksuid collectionId;

  @JsonProperty private Ksuid collectionVersionId;

  @JsonProperty private Map<Ksuid, Ksuid> flowVersionId;

  @JsonProperty private InstanceStatus status;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long created;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long updated;
}

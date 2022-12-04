package com.activepieces.instance.client.model;

import com.activepieces.entity.enums.InstanceStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.UUID;

@NoArgsConstructor
@Getter
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
public class CreateOrUpdateInstanceRequest {

  @JsonProperty @NotNull private Ksuid collectionVersionId;

  @JsonProperty @NotNull private InstanceStatus status;

}

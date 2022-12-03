package com.activepieces.project.client.model;

import com.activepieces.common.validation.constraints.CodeNameConstraints;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder(toBuilder = true)
public class ProjectView {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UUID id;

  @JsonProperty @NotNull @NotEmpty private String displayName;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochCreationTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private String logoUrl;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochUpdateTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UUID organizationId;
}

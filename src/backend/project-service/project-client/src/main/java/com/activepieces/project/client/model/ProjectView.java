package com.activepieces.project.client.model;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.*;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder(toBuilder = true)
public class ProjectView implements EntityMetadata {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private Ksuid id;

  @JsonProperty @NotNull @NotEmpty private String displayName;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long created;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long updated;

}

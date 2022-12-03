package com.activepieces.apikey.client.model;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ApiKeyView implements EntityMetadata {

  public static final String PROJECT_ID = "projectId";

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UUID id;

  @JsonProperty
  @NotNull @NotEmpty
  private String name;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY) private String secret;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY) private long epochCreationTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY) private long epochUpdateTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY) private long epochLastActivity;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY) private UUID projectId;

}

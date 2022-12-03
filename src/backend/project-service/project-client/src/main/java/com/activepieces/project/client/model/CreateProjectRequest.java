package com.activepieces.project.client.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@NoArgsConstructor
@Getter
@Setter
@Builder
@AllArgsConstructor
public class CreateProjectRequest {

  @JsonProperty
  @NotEmpty
  private String displayName;

}
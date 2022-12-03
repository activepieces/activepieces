package com.activepieces.authentication.client.model;

import com.activepieces.entity.enums.UserStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mongodb.util.JSON;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserInformationView {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UUID id;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private String email;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY) private Long epochCreationTime;

  @JsonProperty @NotNull @NotEmpty private String firstName;

  @JsonProperty @NotNull @NotEmpty private String lastName;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UserStatus status;

}

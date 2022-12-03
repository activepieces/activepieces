package com.activepieces.authentication.client.request;

import com.activepieces.authentication.client.validation.ValidPassword;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class SignUpRequest {

  @JsonProperty @NotEmpty private String firstName;

  @JsonProperty @NotEmpty private String lastName;

  @JsonProperty @NotNull
  @ValidPassword private String password;
}

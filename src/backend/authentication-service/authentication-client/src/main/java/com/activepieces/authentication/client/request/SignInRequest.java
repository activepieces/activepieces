package com.activepieces.authentication.client.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SignInRequest {

  @JsonProperty(required = true)
  @Email
  @NotEmpty
  private String email;

  @JsonProperty(required = true)
  @NotEmpty
  private String password;
}

package com.activepieces.entity.subdocuments.field.connection.oauth2;

import com.activepieces.entity.subdocuments.field.Variable;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@SuperBuilder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OAuth2Variable extends Variable<OAuth2Settings> {

  @NotNull @Valid @JsonProperty private OAuth2Settings settings;

  @JsonProperty private Object value;

  @Override
  public boolean validate(Object finalValue) {
    return Objects.nonNull(finalValue);
  }


}

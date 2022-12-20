package com.activepieces.entity.subdocuments.field.oauth2;

import com.activepieces.common.validation.EnumNamePattern;
import com.activepieces.entity.subdocuments.field.Variable;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
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
public class OAuth2Variable extends Variable {

  @NotNull @Valid @JsonProperty private OAuth2Settings settings;

  @JsonProperty private Object value;

  @Override
  public boolean validate(Object finalValue) {
    return Objects.nonNull(finalValue);
  }


}

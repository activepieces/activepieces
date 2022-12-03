package com.activepieces.entity.subdocuments.field.connection.oauth2;

import com.activepieces.common.validation.constraints.EnumNamePattern;
import com.activepieces.entity.enums.OAuth2UserType;
import com.activepieces.entity.subdocuments.field.EmptyField;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "userInputType",
        visible = true,
        defaultImpl = OAuth2EmptySettings.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = OAuth2LoginSettings.class, name = "CONNECTION")
})
@Setter
@SuperBuilder(toBuilder = true)
public abstract class OAuth2Settings {

  @EnumNamePattern(regexp = "CONNECTION")
  @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
  @NotNull
  private OAuth2UserType userInputType;

}

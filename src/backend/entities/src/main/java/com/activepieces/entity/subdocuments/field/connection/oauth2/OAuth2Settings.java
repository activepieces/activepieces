package com.activepieces.entity.subdocuments.field.connection.oauth2;

import com.activepieces.common.validation.EnumNamePattern;
import com.activepieces.entity.enums.OAuth2Type;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Setter
@SuperBuilder(toBuilder = true)
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type",
        visible = true,
        defaultImpl = OAuth2EmptySettings.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = OAuth2PredefinedSettings.class, name = "PREDEFINED"),
        @JsonSubTypes.Type(value = OAuth2CustomSettings.class, name = "CUSTOM"),
})
public abstract class OAuth2Settings implements Serializable {

  @EnumNamePattern(regexp = "PREDEFINED|CUSTOM")
  @JsonProperty
  @NotNull
  private String type;

  @JsonProperty
  private String componentName;

  @JsonProperty
  @NotNull
  @NotEmpty
  private String responseType;


  public OAuth2Type getType(){
    return OAuth2Type.valueOf(type);
  }
}

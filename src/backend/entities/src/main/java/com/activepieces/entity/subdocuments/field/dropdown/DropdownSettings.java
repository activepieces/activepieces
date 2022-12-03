package com.activepieces.entity.subdocuments.field.dropdown;

import com.activepieces.common.validation.constraints.EnumNamePattern;
import com.activepieces.entity.enums.OAuth2UserType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "dropdownType",
        visible = true,
        defaultImpl = EmptyDropdownSettings.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = StaticDropdownSettings.class, name = "STATIC")
})
@Setter
@SuperBuilder(toBuilder = true)
public abstract class DropdownSettings {

  @EnumNamePattern(regexp = "STATIC")
  @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
  @NotNull
  private DropdownVariableType dropdownType;

  @JsonProperty
  @NotNull
  private boolean required;

}

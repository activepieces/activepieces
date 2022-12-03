package com.activepieces.entity.subdocuments.field.settings;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;

@SuperBuilder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class DropdownOption {

  @NotNull @JsonProperty private String label;

  @NotNull @JsonProperty private Object value;

}

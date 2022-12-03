package com.activepieces.entity.subdocuments.field.settings;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.util.List;

@SuperBuilder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ShortTextSettings {

  @NotNull @JsonProperty private boolean required;

  @NotNull @JsonProperty private boolean dropdown;

  @NotNull @JsonProperty private List<DropdownOption> dropdownOptions;
}

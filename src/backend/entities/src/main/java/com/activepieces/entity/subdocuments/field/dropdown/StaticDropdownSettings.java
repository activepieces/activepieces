package com.activepieces.entity.subdocuments.field.dropdown;

import com.activepieces.entity.subdocuments.field.settings.DropdownOption;
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
public class StaticDropdownSettings extends DropdownSettings{

  @JsonProperty @NotNull private List<DropdownOption> options;

}

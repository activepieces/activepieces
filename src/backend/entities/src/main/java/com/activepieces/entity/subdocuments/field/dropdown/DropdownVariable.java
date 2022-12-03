package com.activepieces.entity.subdocuments.field.dropdown;

import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.common.code.ArtifactMetadataSettings;
import com.activepieces.entity.subdocuments.field.Variable;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.apache.commons.io.FilenameUtils;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.Objects;
import java.util.UUID;

@SuperBuilder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DropdownVariable extends Variable<DropdownSettings> {

  @JsonProperty @NotNull @Valid
  private DropdownSettings settings;

  @JsonProperty private Object value;

  public Object getValue() {
    return value;
  }

  public boolean validate(Object finalValue) {
    return (Objects.nonNull(finalValue));
  }


}

package com.activepieces.entity.subdocuments.field;

import com.activepieces.entity.enums.VariableSource;
import com.activepieces.entity.subdocuments.field.settings.NormalSettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.util.Objects;

@SuperBuilder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NumberVariable extends Variable<NormalSettings>  {

    @JsonProperty
    @NotNull
    private NormalSettings settings;

    @JsonProperty
    private Object value;

    public Object getValue() {
        return value;
    }

    public boolean validate(Object finalValue) {
        if(getSource().equals(VariableSource.PREDEFINED)){
            return Objects.nonNull(finalValue);
        }
        return (Objects.nonNull(finalValue) && finalValue instanceof Double) || !settings.isRequired();
    }
}

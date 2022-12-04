package com.activepieces.entity.subdocuments.field;

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
public class CheckboxVariable extends Variable  {

    @JsonProperty
    private Object value;

    public boolean validate(Object finalValue) {
        return Objects.nonNull(finalValue);
    }

    public Object getValue() {
        return value;
    }
}

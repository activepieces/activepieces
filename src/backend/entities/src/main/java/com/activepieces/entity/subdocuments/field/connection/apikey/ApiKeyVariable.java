package com.activepieces.entity.subdocuments.field.connection.apikey;

import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.entity.subdocuments.field.VariableSettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.Objects;

@SuperBuilder
@Getter
@Setter
@AllArgsConstructor
public class ApiKeyVariable extends Variable<ApiKeySettings> {

    @JsonProperty
    private ApiKeySettings settings;

    @JsonProperty
    private ApiKeyValue value;

    @Override
    public boolean validate(Object finalValue) {
    return Objects.nonNull(finalValue);
    }
}

package com.activepieces.entity.subdocuments.field;

import com.activepieces.common.validation.ConditionalValidation;
import com.activepieces.common.validation.EnumNamePattern;
import com.activepieces.entity.enums.InputVariableType;
import com.activepieces.entity.enums.VariableSource;
import com.activepieces.entity.subdocuments.field.connection.apikey.ApiKeyVariable;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Variable;
import com.activepieces.entity.subdocuments.field.dropdown.DropdownVariable;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;

@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Getter
@Setter
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type", visible = true, defaultImpl = EmptyField.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = CheckboxVariable.class, name = "CHECKBOX"),
        @JsonSubTypes.Type(value = PasswordVariable.class, name = "PASSWORD"),
        @JsonSubTypes.Type(value = DropdownVariable.class, name = "DROPDOWN"),
        @JsonSubTypes.Type(value = OAuth2Variable.class, name = "OAUTH2"),
        @JsonSubTypes.Type(value = ApiKeyVariable.class, name = "API_KEY"),
        @JsonSubTypes.Type(value = IntegerVariable.class, name = "INTEGER"),
        @JsonSubTypes.Type(value = NumberVariable.class, name = "NUMBER"),
        @JsonSubTypes.Type(value = KeyValueVariable.class, name = "DICTIONARY"),
        @JsonSubTypes.Type(value = MultilineVariable.class, name = "LONG_TEXT"),
        @JsonSubTypes.Type(value = ShortTextVariable.class, name = "SHORT_TEXT"),}
)
@ConditionalValidation(
        conditionalProperty = "source", values = {"USER"},
        requiredProperties = {"label"},
        message = "label and hintText are required for user variable.")
@ConditionalValidation(
        conditionalProperty = "source", values = {"PREDEFINED"},
        requiredProperties = {"value"},
        message = "value are required for predefined variable.")
public abstract class Variable<T> implements ValueField, VariableSettings<T> {

    @JsonProperty
    @NotNull
    private String key;

    @EnumNamePattern(regexp = "DROPDOWN|CHECKBOX|PASSWORD|INTEGER|DICTIONARY|LONG_TEXT|SHORT_TEXT|API_KEY|OAUTH2")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private InputVariableType type;

    @JsonProperty
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String label;

    @JsonProperty
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String hintText;

    @JsonProperty
    @NotNull
    private VariableSource source;

}

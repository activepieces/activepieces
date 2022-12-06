package com.activepieces.entity.subdocuments.field;

import com.activepieces.common.validation.EnumNamePattern;
import com.activepieces.entity.enums.InputVariableType;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Variable;
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
        @JsonSubTypes.Type(value = OAuth2Variable.class, name = "OAUTH2"),
        @JsonSubTypes.Type(value = NumberVariable.class, name = "NUMBER"),
        @JsonSubTypes.Type(value = KeyValueVariable.class, name = "DICTIONARY"),
        @JsonSubTypes.Type(value = MultilineVariable.class, name = "LONG_TEXT"),
        @JsonSubTypes.Type(value = ShortTextVariable.class, name = "SHORT_TEXT"),}
)
public abstract class Variable implements ValueField {

    @JsonProperty
    @NotNull
    private String key;

    @EnumNamePattern(regexp = "CHECKBOX|PASSWORD|INTEGER|DICTIONARY|LONG_TEXT|SHORT_TEXT|OAUTH2")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private InputVariableType type;

}

package com.activepieces.entity.subdocuments.action.settings;

import com.activepieces.entity.enums.StoreOperation;
import com.activepieces.entity.enums.StoreScope;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class StoreSettings {

    @NotNull
    @JsonProperty
    private StoreOperation operation;

    @NotNull
    @JsonProperty
    private StoreScope scope;

    @NotNull
    @NotEmpty
    @JsonProperty
    private String key;

    @JsonProperty
    private Object value;
}

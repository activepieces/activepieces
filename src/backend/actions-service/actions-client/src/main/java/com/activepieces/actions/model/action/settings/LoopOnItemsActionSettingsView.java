package com.activepieces.actions.model.action.settings;

import com.activepieces.common.validation.constraints.NotEmptyIfString;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class LoopOnItemsActionSettingsView {

    @JsonProperty
    @NotNull
    @NotEmptyIfString
    private Object items;

}


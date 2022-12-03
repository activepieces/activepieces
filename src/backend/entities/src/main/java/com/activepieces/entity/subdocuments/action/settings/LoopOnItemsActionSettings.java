package com.activepieces.entity.subdocuments.action.settings;

import com.activepieces.entity.subdocuments.action.ActionMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class LoopOnItemsActionSettings {

    @JsonProperty
    private Object items;
}


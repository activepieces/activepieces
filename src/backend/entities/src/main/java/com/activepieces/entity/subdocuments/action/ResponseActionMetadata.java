package com.activepieces.entity.subdocuments.action;

import com.activepieces.entity.subdocuments.action.settings.ResponseSettings;
import com.activepieces.entity.subdocuments.action.settings.StoreSettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class ResponseActionMetadata extends ActionMetadata {

    @JsonProperty
    private ResponseSettings settings;


}
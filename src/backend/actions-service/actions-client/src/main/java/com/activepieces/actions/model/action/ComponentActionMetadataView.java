package com.activepieces.actions.model.action;

import com.activepieces.actions.model.action.settings.ComponentSettingsView;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.apache.commons.io.FilenameUtils;
import org.springframework.data.annotation.Transient;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

@Getter
@Setter
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class ComponentActionMetadataView extends ActionMetadataView   {

    @JsonProperty
    @NotNull
    @Valid
    private ComponentSettingsView settings;


}

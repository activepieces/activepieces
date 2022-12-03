package com.activepieces.actions.model.action;

import com.activepieces.actions.model.action.settings.CodeSettingsView;
import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.common.code.ArtifactMetadataSettings;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.apache.commons.io.FilenameUtils;
import org.springframework.data.annotation.Transient;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class CodeActionMetadataView extends ActionMetadataView implements ArtifactMetadata {

    @JsonProperty
    @NotNull
    @Valid
    private CodeSettingsView settings;

    @Override
    @Transient
    public String getSourcePath(Ksuid flowVersionId) {
        return flowVersionId + "/" + getName() + "/source.zip";
    }

    @Override
    @Transient
    public String getPackagePath(Ksuid flowVersionId) {
        return flowVersionId + "/" + getName() + "/" + FilenameUtils.removeExtension(settings.getArtifact()) + ".js";
    }

    @Override
    public ArtifactMetadataSettings getArtifactSettings() {
        return settings;
    }

}

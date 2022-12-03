package com.activepieces.action.component;

import com.activepieces.actions.model.action.settings.ComponentSettingsView;
import com.activepieces.common.error.exception.ManifestNotFoundException;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.io.InputStream;

public interface ComponentService {

    InputStream generateCode(ComponentSettingsView componentSettingsView) throws Exception;

    ComponentManifestView getManifest(@NonNull final String componentName,
                                      @NonNull final String componentVersion) throws ManifestNotFoundException;
}

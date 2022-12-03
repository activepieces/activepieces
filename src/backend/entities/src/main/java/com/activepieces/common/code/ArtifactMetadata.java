package com.activepieces.common.code;

import java.util.UUID;

public interface ArtifactMetadata {

    String getSourcePath(UUID resourceId);

    String getPackagePath(UUID resourceId);

    ArtifactMetadataSettings getArtifactSettings();
}

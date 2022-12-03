package com.activepieces.common.code;

import com.github.ksuid.Ksuid;

import java.util.UUID;

public interface ArtifactMetadata {

    String getSourcePath(Ksuid resourceId);

    String getPackagePath(Ksuid resourceId);

    ArtifactMetadataSettings getArtifactSettings();
}

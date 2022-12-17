package com.activepieces.common.model;

import com.github.ksuid.Ksuid;

public interface ArtifactMetadataSettings {

    Ksuid getArtifactSourceId();

    void setArtifactSourceId(Ksuid artifact);

    Ksuid getArtifactPackagedId();

    void setArtifactPackagedId(Ksuid artifactPackagedId);

    ArtifactFile getNewArtifactToUploadFile();

    void setNewArtifactToUploadFile(ArtifactFile artifactToUploadFile);

}

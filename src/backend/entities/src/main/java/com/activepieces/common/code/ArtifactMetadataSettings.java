package com.activepieces.common.code;

public interface ArtifactMetadataSettings {

    String getArtifact();

    void setArtifact(String artifact);

    String getArtifactUrl();

    void setArtifactUrl(String artifactUrl);

    ArtifactFile getNewArtifactToUploadFile();

    void setNewArtifactToUploadFile(ArtifactFile artifactToUploadFile);

}

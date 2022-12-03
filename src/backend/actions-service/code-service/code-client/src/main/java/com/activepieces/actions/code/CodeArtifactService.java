package com.activepieces.actions.code;

import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.common.code.ArtifactReference;
import com.activepieces.entity.subdocuments.field.Variable;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

public interface CodeArtifactService {

  boolean exists(String fileName);

  String upload(String absolutePath, InputStream artifact);

  String getSignedUrlForSource(UUID flowVersionId, ArtifactMetadata artifactMetadata);

  InputStream getInputStream(String bucketFilePath);

  List<ArtifactFile> toArtifacts(List<MultipartFile> files);

  ArtifactReference handleFlowUpgrade(
          UUID newFlowVersionId,
          UUID previousVersionId,
          ArtifactFile artifactFileToUpload,
          ArtifactMetadata artifactMetadata,
          String currentArtifactHash,
          String currentArtifactUrl);

}

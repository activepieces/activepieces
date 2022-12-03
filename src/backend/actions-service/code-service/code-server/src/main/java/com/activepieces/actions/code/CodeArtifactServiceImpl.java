package com.activepieces.actions.code;

import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.code.ArtifactReference;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.utils.HashUtils;
import com.activepieces.entity.enums.InputVariableType;
import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.entity.subdocuments.field.dropdown.DropdownSettings;
import com.activepieces.entity.subdocuments.field.dropdown.DropdownVariable;
import com.activepieces.entity.subdocuments.field.dropdown.DropdownVariableType;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.channels.Channels;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Log4j2
public class CodeArtifactServiceImpl implements CodeArtifactService {

  private final ErrorServiceHandler errorServiceHandler;

  @Autowired
  public CodeArtifactServiceImpl(
      final ErrorServiceHandler errorServiceHandler)
      throws IOException {
    this.errorServiceHandler = errorServiceHandler;
  }

  @Override
  public boolean exists(String fileName) {
    return false;
  }

  @Override
  public String upload(String absolutePath, InputStream artifact) {
    return null;
  }

  @Override
  public String getSignedUrlForSource(UUID flowVersionId, ArtifactMetadata artifactMetadata) {
    return null;
  }

  @Override
  public InputStream getInputStream(String bucketFilePath) {
    return null;
  }

  @Override
  public List<ArtifactFile> toArtifacts(List<MultipartFile> files) {
    return null;
  }

  @Override
  public ArtifactReference handleFlowUpgrade(UUID newFlowVersionId, UUID previousVersionId, ArtifactFile artifactFileToUpload, ArtifactMetadata artifactMetadata, String currentArtifactHash, String currentArtifactUrl) {
    return null;
  }

/*  public boolean exists(String fileName) {
    BlobId blobId = BlobId.of(bucketName, fileName);
    Blob blob = storage.get(blobId);
    return Objects.nonNull(blob) && blob.exists();
  }

  private void copyArtifact(String sourcePath, String targetPath) {
    log.info("Copying artifact from {} to {}", sourcePath, targetPath);
    storage.copy(
        Storage.CopyRequest.of(
            BlobId.of(bucketName, sourcePath), BlobId.of(bucketName, targetPath)));
  }

  @Override
  public String upload(String absolutePath, InputStream artifact) {
    try {
      BlobId rawBlobId = BlobId.of(bucketName, absolutePath);
      Blob blob = storage.create(BlobInfo.newBuilder(rawBlobId).build(), artifact.readAllBytes());
      log.info("Successfully uploaded code artifact / raw with name=" + rawBlobId.getName());
      return storage.signUrl(blob, 7, TimeUnit.DAYS).toExternalForm();
    } catch (IOException exception) {
      throw errorServiceHandler.createInternalError(exception);
    }
  }

  @Override
  public String getSignedUrlForSource(UUID flowVersionId, ArtifactMetadata artifactMetadata) {
    BlobId blobId = BlobId.of(bucketName, artifactMetadata.getSourcePath(flowVersionId));
    return storage.signUrl(BlobInfo.newBuilder(blobId).build(), 7, TimeUnit.DAYS).toExternalForm();
  }

  public InputStream getInputStream(String bucketFilePath) {
    BlobId blobId = BlobId.of(bucketName, bucketFilePath);
    return Channels.newInputStream(storage.reader(blobId));
  }

  @Override
  public List<ArtifactFile> toArtifacts(List<MultipartFile> files) {
    return files.stream()
        .map(
            f -> {
              try {
                ArtifactFile artifactFile =
                    ArtifactFile.builder()
                        .contentType(f.getContentType())
                        .originalFileName(f.getOriginalFilename())
                        .inputStream(f.getInputStream())
                        .build();
                artifactFile.setHashWithExtension(
                    HashUtils.getFileNameAfterUpload(
                        artifactFile.getOriginalFileName(), artifactFile.getInputStream()));
                return artifactFile;
              } catch (IOException e) {
                e.printStackTrace();
              }
              return null;
            })
        .collect(Collectors.toList());
  }

  @Override
  public ArtifactReference handleFlowUpgrade(
      UUID newFlowVersionId,
      UUID previousVersionId,
      ArtifactFile artifactFileToUpload,
      ArtifactMetadata artifactMetadata,
      String currentArtifactHash,
      String currentArtifactUrl) {
    String artifactUrl = currentArtifactUrl;
    String artifact = currentArtifactHash;
    if (Objects.nonNull(artifactFileToUpload)) {
      artifactUrl =
          upload(
              artifactMetadata.getSourcePath(newFlowVersionId),
              artifactFileToUpload.getInputStream());
      artifact = artifactFileToUpload.getHashWithExtension();
    } else if (Objects.nonNull(previousVersionId)) {
      String sourceFilePath = artifactMetadata.getSourcePath(previousVersionId);
      String targetFilePath = artifactMetadata.getSourcePath(newFlowVersionId);
      if (!exists(targetFilePath)) {
        copyArtifact(sourceFilePath, targetFilePath);
      }
      artifact = currentArtifactHash;
      artifactUrl = getSignedUrlForSource(newFlowVersionId, artifactMetadata);
    }
    return ArtifactReference.builder().artifact(artifact).artifactUrl(artifactUrl).build();
  }*/

}

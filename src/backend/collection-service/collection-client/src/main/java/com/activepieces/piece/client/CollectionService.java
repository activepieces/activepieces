package com.activepieces.piece.client;

import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.common.error.exception.InvalidCodeArtifactException;
import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import com.activepieces.piece.client.model.CreatePieceRequest;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollectionService {

  SeekPage<CollectionView> listByProjectId(UUID projectId, SeekPageRequest pageRequest, List<Criteria> criteria) throws CollectionNotFoundException, PermissionDeniedException;

  CollectionView create(UUID projectId, CreatePieceRequest view, Optional<MultipartFile> logo, List<ArtifactFile> files) throws PermissionDeniedException, ResourceNotFoundException, InvalidImageFormatException, IOException, CollectionVersionNotFoundException, InvalidCodeArtifactException;

  Optional<CollectionView> getOptional(UUID id) throws PermissionDeniedException;

  CollectionView get(UUID id) throws CollectionNotFoundException, PermissionDeniedException;

  CollectionView update(UUID id, CollectionVersionView view, Optional<MultipartFile> logo, List<ArtifactFile> files)
          throws CollectionNotFoundException, PermissionDeniedException, ResourceNotFoundException, InvalidImageFormatException, IOException, CollectionVersionNotFoundException, CollectionVersionAlreadyLockedException, InvalidCodeArtifactException;

  void archive(UUID id) throws CollectionNotFoundException, PermissionDeniedException, ResourceNotFoundException;
}

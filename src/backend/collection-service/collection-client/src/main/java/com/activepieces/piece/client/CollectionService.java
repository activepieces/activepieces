package com.activepieces.piece.client;

import com.activepieces.common.error.exception.InvalidCodeArtifactException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionView;
import com.activepieces.piece.client.model.CreatePieceRequest;
import com.github.ksuid.Ksuid;

import java.io.IOException;
import java.util.Optional;

public interface CollectionService {

  SeekPage<CollectionView> listByProjectId(Ksuid projectId, SeekPageRequest pageRequest) throws CollectionNotFoundException, PermissionDeniedException;

  CollectionView create(Ksuid projectId, CreatePieceRequest view) throws PermissionDeniedException, ResourceNotFoundException, IOException, CollectionVersionNotFoundException, InvalidCodeArtifactException;

  Optional<CollectionView> getOptional(Ksuid id) throws PermissionDeniedException;

  CollectionView get(Ksuid id) throws CollectionNotFoundException, PermissionDeniedException;

  CollectionView update(Ksuid id, CollectionVersionView view)
          throws CollectionNotFoundException, PermissionDeniedException, ResourceNotFoundException, IOException, CollectionVersionNotFoundException, CollectionVersionAlreadyLockedException, InvalidCodeArtifactException;

  void delete(Ksuid id) throws CollectionNotFoundException, PermissionDeniedException, ResourceNotFoundException;
}

package com.activepieces.piece.client;


import com.activepieces.common.error.exception.InvalidImageFormatException;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionInvalidStateException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.piece.client.model.CollectionMetaVersionView;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollectionVersionService {

    CollectionVersionView create(UUID collectionId, UUID previousVersionId, CollectionVersionView view, Optional<MultipartFile> logo) throws ResourceNotFoundException, IOException, InvalidImageFormatException, PermissionDeniedException, CollectionVersionNotFoundException;

    CollectionVersionView get(UUID id) throws CollectionVersionNotFoundException, PermissionDeniedException;

    void commit(UUID id) throws PermissionDeniedException, CollectionVersionNotFoundException, CollectionVersionAlreadyLockedException, FlowNotFoundException, CollectionInvalidStateException;

    CollectionVersionView update(UUID id, CollectionVersionView view, Optional<MultipartFile> logo) throws PermissionDeniedException, CollectionVersionNotFoundException, InvalidImageFormatException, IOException, CollectionVersionAlreadyLockedException;

    List<CollectionMetaVersionView> listByCollectionId(UUID collectionId) throws CollectionNotFoundException, PermissionDeniedException;

    Optional<CollectionVersionView> getOptional(UUID id) throws PermissionDeniedException;

}

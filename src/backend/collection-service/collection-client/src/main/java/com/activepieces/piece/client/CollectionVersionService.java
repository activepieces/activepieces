package com.activepieces.piece.client;


import com.activepieces.common.error.exception.collection.CollectionInvalidStateException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.piece.client.model.CollectionMetaVersionView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.github.ksuid.Ksuid;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface CollectionVersionService {

    CollectionVersionView create(Ksuid collectionId, CollectionVersionView view) throws ResourceNotFoundException, PermissionDeniedException, CollectionVersionNotFoundException;

    CollectionVersionView getLatest(Ksuid collectionId) throws PermissionDeniedException;

    CollectionVersionView get(Ksuid id) throws CollectionVersionNotFoundException, PermissionDeniedException;

    void commit(Ksuid id) throws PermissionDeniedException, CollectionVersionNotFoundException, CollectionVersionAlreadyLockedException, FlowNotFoundException, CollectionInvalidStateException;

    CollectionVersionView update(Ksuid id, CollectionVersionView view) throws PermissionDeniedException, CollectionVersionNotFoundException, CollectionVersionAlreadyLockedException;

    List<CollectionMetaVersionView> listByCollectionId(Ksuid collectionId) throws CollectionNotFoundException, PermissionDeniedException;

    Optional<CollectionVersionView> getOptional(Ksuid id) throws PermissionDeniedException;

}

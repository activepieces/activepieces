package com.activepieces.instance.client;

import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.collection.*;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import com.activepieces.instance.client.model.CreateOrUpdateInstanceRequest;
import com.activepieces.instance.client.model.InstanceView;
import com.activepieces.variable.model.exception.MissingConfigsException;
import com.github.ksuid.Ksuid;

import java.util.Optional;

public interface InstanceService {

  SeekPage<InstanceView> listByCollectionId(Ksuid collectionId, SeekPageRequest pageRequest) throws PermissionDeniedException, InstanceNotFoundException;

  InstanceView create(Ksuid collectionId, CreateOrUpdateInstanceRequest instanceRequest) throws PermissionDeniedException, ResourceNotFoundException, FlowVersionNotFoundException, MissingConfigsException, CollectionVersionNotFoundException, CollectionNotFoundException, FlowNotFoundException, CollectionInvalidStateException, CollectionVersionAlreadyLockedException;

  Optional<InstanceView> getOptional(Ksuid id) throws PermissionDeniedException;

  InstanceView get(Ksuid id) throws PermissionDeniedException, InstanceNotFoundException;

  void delete(Ksuid id) throws PermissionDeniedException, ResourceNotFoundException, InstanceNotFoundException, InterruptedException;
  InstanceView getByCollectionId(Ksuid collectionId) throws PermissionDeniedException, CollectionInstanceNotFoundException;
}

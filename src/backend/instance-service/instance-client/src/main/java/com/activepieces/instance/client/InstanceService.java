package com.activepieces.instance.client;

import com.activepieces.common.error.exception.InstanceNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InstanceService {

  List<InstanceView> upgradeAllInstances(Ksuid collectionVersionId)  throws PermissionDeniedException, CollectionNotFoundException, CollectionVersionNotFoundException;

  SeekPage<InstanceView> listByProjectId(Ksuid projectId, SeekPageRequest pageRequest) throws PermissionDeniedException, InstanceNotFoundException;

  InstanceView create(CreateOrUpdateInstanceRequest view) throws PermissionDeniedException, ResourceNotFoundException, FlowVersionNotFoundException, MissingConfigsException, CollectionVersionNotFoundException;

  Optional<InstanceView> getOptional(Ksuid id) throws PermissionDeniedException;

  InstanceView get(Ksuid id) throws PermissionDeniedException, InstanceNotFoundException;

  InstanceView update(Ksuid id, CreateOrUpdateInstanceRequest view)
          throws PermissionDeniedException, FlowNotFoundException, FlowVersionNotFoundException, MissingConfigsException, InstanceNotFoundException, CollectionVersionNotFoundException;

  void delete(Ksuid id) throws PermissionDeniedException, ResourceNotFoundException, InstanceNotFoundException, InterruptedException;
}

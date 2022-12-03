package com.activepieces.flow.validator;

import com.activepieces.common.code.ArtifactFile;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.guardian.client.exception.PermissionDeniedException;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public interface FlowVersionRequestBuilder {

  FlowVersionView construct(UUID projectId,
          UUID collectionId
          , FlowVersionView newVersion, List<ArtifactFile> artifactFileList, FlowVersionView draftVersion) throws Exception;
}

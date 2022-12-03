package com.activepieces.flow.validator;

import com.activepieces.common.code.ArtifactFile;
import com.activepieces.flow.model.FlowVersionView;
import com.github.ksuid.Ksuid;

import java.util.List;
import java.util.UUID;

public interface FlowVersionRequestBuilder {

  FlowVersionView construct(Ksuid projectId,
          Ksuid collectionId, FlowVersionView newVersion, List<ArtifactFile> artifactFileList, FlowVersionView draftVersion) throws Exception;
}

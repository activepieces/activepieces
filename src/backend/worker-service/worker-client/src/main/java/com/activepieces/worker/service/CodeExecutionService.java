package com.activepieces.worker.service;

import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.worker.model.ExecutionCodeResult;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.InputStream;
import java.util.UUID;

public interface CodeExecutionService {

    ExecutionCodeResult executeCodeWithCache(
            JsonNode input, UUID resourceId, ArtifactMetadata artifactMetadata, String artifactFile)
            throws InterruptedException;


    ExecutionCodeResult executeCode(JsonNode input, InputStream artifactHash) throws Exception;

}

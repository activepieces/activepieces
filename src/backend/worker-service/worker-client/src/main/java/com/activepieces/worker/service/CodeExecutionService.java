package com.activepieces.worker.service;

import com.activepieces.worker.model.ExecutionCodeResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.github.ksuid.Ksuid;

import java.io.InputStream;

public interface CodeExecutionService {


    ExecutionCodeResult executeCode(JsonNode input, InputStream artifactHash) throws Exception;

}

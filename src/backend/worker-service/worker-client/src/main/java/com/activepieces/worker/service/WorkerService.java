package com.activepieces.worker.service;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.model.WorkerExecutionResult;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Map;
import java.util.UUID;

public interface WorkerService {

     InstanceRunView executeFlow(
             InstanceRunView instanceRun,
             CollectionVersionView collectionVersionView,
             FlowVersionView flowVersionView,
             Map<String, Object> configsInput,
             Map<String, Object> context,
             Map<String, Object> triggerPayload,
             StorePath storePath) throws Exception;

}

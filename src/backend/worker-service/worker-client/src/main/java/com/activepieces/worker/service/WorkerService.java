package com.activepieces.worker.service;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;

import java.util.Map;

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

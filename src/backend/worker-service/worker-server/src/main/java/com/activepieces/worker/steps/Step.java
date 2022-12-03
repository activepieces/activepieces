package com.activepieces.worker.steps;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.entity.nosql.InstanceRun;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.Worker;
import com.activepieces.worker.model.WorkerExecutionResult;

import java.util.Collection;
import java.util.Map;

public abstract class Step {

  public abstract void next(
          InstanceRunView instanceRun,
          CollectionVersionView collectionVersion,
          FlowVersionView flowVersion,
          Map<String, Object> configInput,
          Map<String, Object> triggerPayload,
          Map<String, Object> context,
          Map<String, Object> output,
          StorePath storePath)
      throws Exception;
}

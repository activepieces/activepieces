package com.activepieces.worker.steps;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.Worker;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;

import java.io.IOException;
import java.util.Map;

@Log4j2
public class PrepareSandbox extends Step {
  private final Worker worker;

  public PrepareSandbox(@NonNull final Worker worker) {
    this.worker = worker;
  }

  @Override
  public void next(
          InstanceRunView instanceRunView,
          CollectionVersionView collectionVersionView,
          FlowVersionView flowVersionView,
          Map<String, Object> configInput,
          Object triggerPayload,
          Map<String, Object> output,
          StorePath storePath)
      throws IOException, InterruptedException {
    worker.getSandbox().clean();
    worker.getSandbox().init();
  }
}

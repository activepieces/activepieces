package com.activepieces.worker.service;

import com.activepieces.worker.workers.CodeBuildWorker;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Service
public class CodeBuildService {

  private final BlockingQueue<Integer> blockingQueue;
  private final ArrayList<CodeBuildWorker> workers;
  private static final int NUMBER_OF_BUILDER = 32;

  @Autowired
  public CodeBuildService(@NonNull final ObjectMapper objectMapper) {
    this.blockingQueue = new LinkedBlockingQueue<>();
    this.workers = new ArrayList<>();
    for (int i = 0; i < NUMBER_OF_BUILDER; ++i) {
      final CodeBuildWorker codeBuildWorker = new CodeBuildWorker(i, objectMapper);
      workers.add(codeBuildWorker);
      blockingQueue.add(i);
    }
  }

  public CodeBuildWorker obtainWorker() throws InterruptedException {
    int workerIndex = this.blockingQueue.take();
    return workers.get(workerIndex);
  }

  public void releaseWorker(CodeBuildWorker worker) {
    blockingQueue.add(worker.getWorkerId());
  }
}

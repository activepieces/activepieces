package com.activepieces.worker;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.authentication.client.JWTService;
import com.activepieces.file.service.FileService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.service.FlowArtifactBuilderService;
import com.activepieces.worker.steps.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Log4j2
public class Worker {

    private final int workerId;
    private final Sandbox sandbox;
    private final List<Step> steps = new ArrayList<>();
    private final String apiUrl;

    public Worker(
            int workerId,
            @NonNull final String apiUrl,
            @NonNull final JWTService jwtService,
            @NonNull FlowArtifactBuilderService builderService,
            @NonNull InstanceRunService instanceRunService,
            @NonNull FileService fileService,
            @NonNull ObjectMapper objectMapper) {
        this.workerId = workerId;
        this.sandbox = new Sandbox(jwtService, workerId);
        this.apiUrl = apiUrl;
        steps.add(new PrepareSandbox(this));
        steps.add(
                new DownloadRequiredFiles(
                        this,
                        apiUrl,
                        fileService,
                        builderService,
                        objectMapper));
        steps.add(new ExecuteWorker(this, objectMapper));
        steps.add(new UploadRunState(instanceRunService));
    }

    public InstanceRunView run(
            InstanceRunView instanceRunView,
            CollectionVersionView collectionVersion,
            FlowVersionView flowVersion,
            Map<String, Object> configs,
            Map<String, Object> triggerPayload,
            StorePath storePath)
            throws Exception {
        long startTimeMs = System.currentTimeMillis();
        HashMap<String, Object> output = new HashMap<>();
        for (Step step : steps) {
            step.next(instanceRunView, collectionVersion, flowVersion, configs, triggerPayload, output, storePath);
        }
        log.info("Preparing Sandbox {} took {}ms", sandbox.getBoxId(), System.currentTimeMillis() - startTimeMs);
        return (InstanceRunView) output.get(Constants.RUN_RESULT_IN_MAP);
    }
}

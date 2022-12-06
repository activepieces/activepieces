package com.activepieces.worker.steps;

import com.activepieces.actions.model.action.CodeActionMetadataView;
import com.activepieces.actions.store.model.StorePath;
import com.activepieces.common.error.exception.CodeArtifactBuildFailure;
import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.entity.sql.FileEntity;
import com.activepieces.file.service.FileService;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.Constants;
import com.activepieces.worker.Worker;
import com.activepieces.worker.service.FlowArtifactBuilderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@Log4j2
public class DownloadRequiredFiles extends Step {

    private final ObjectMapper objectMapper;
    private final FlowArtifactBuilderService flowBuilderService;
    private final FileService fileService;
    private final Worker worker;
    private final String apiUrl;

    public DownloadRequiredFiles(
            @NonNull final Worker worker,
            @NonNull final String apiUrl,
            @NonNull final FileService fileService,
            @NonNull final FlowArtifactBuilderService flowBuilderService,
            @NonNull final ObjectMapper objectMapper) {
        this.apiUrl = apiUrl;
        this.objectMapper = objectMapper;
        this.fileService = fileService;
        this.flowBuilderService = flowBuilderService;
        this.worker = worker;
    }

    @Override
    public void next(
            InstanceRunView instanceRunView,
            CollectionVersionView collectionVersionView,
            FlowVersionView flowVersionView,
            Map<String, Object> configs,
            Map<String, Object> triggerPayload,
            Map<String, Object> context,
            Map<String, Object> output,
            StorePath storePath)
            throws Exception {
        long startTime = System.currentTimeMillis();
        flowVersionView = flowBuilderService.buildAllSteps(flowVersionView);
        downloadArtifacts(flowVersionView);
        worker.getSandbox().writeContext(context, objectMapper);
        worker.getSandbox().writeConfigs(configs, objectMapper);
        worker.getSandbox()
                .writeEntryPoint(
                        collectionVersionView,
                        flowVersionView,
                        apiUrl,
                        objectMapper);
        worker.getSandbox().writeTriggerPayload(triggerPayload, objectMapper);
        worker.getSandbox().writeFlow(flowVersionView, objectMapper);
        worker.getSandbox().writeCollection(collectionVersionView, objectMapper);

        final Resource workerExecutor = new ClassPathResource(Constants.ACTIVEPIECES_WORKER_JS);
        final File workerExecutorDest =
                new File(worker.getSandbox().getSandboxFilePath(Constants.ACTIVEPIECES_WORKER_JS));
        Files.copy(
                workerExecutor.getInputStream(),
                workerExecutorDest.toPath(),
                StandardCopyOption.REPLACE_EXISTING);
        log.info("Downloading artifacts took {}ms", System.currentTimeMillis() - startTime);
    }

    private void downloadArtifacts(FlowVersionView flowVersionView) {
        final List<CodeActionMetadataView> allCodeActions = FlowVersionUtil.findCodeActions(flowVersionView);

        allCodeActions.parallelStream()
                .forEach(
                        codeSettings -> {
                            try {
                                FileEntity fileEntity = fileService.getFileById(codeSettings.getSettings().getArtifactPackagedId()).get();
                                String jsFileName =
                                        ArtifactUtils.bundledFileName(
                                                codeSettings.getSettings().getArtifactPackagedId().toString());
                                InputStream inputStream = new ByteArrayInputStream(fileEntity.getData());
                                worker.getSandbox().writeCode(jsFileName, inputStream);
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        });
    }

}

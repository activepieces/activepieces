package com.activepieces.worker.steps;

import com.activepieces.actions.store.model.StorePath;
import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.common.error.exception.CodeArtifactBuildFailure;
import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.flow.util.FlowVersionUtil;
import com.activepieces.logging.client.model.InstanceRunView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.worker.Constants;
import com.activepieces.worker.Worker;
import com.activepieces.worker.service.LocalArtifactCacheServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Log4j2
public class DownloadRequiredFiles extends Step {

    private final ObjectMapper objectMapper;
    private final LocalArtifactCacheServiceImpl localCacheService;
    private final Worker worker;
    private final String apiUrl;

    public DownloadRequiredFiles(
            @NonNull final Worker worker,
            @NonNull final String apiUrl,
            @NonNull final LocalArtifactCacheServiceImpl localCacheService,
            @NonNull final ObjectMapper objectMapper) {
        this.apiUrl = apiUrl;
        this.objectMapper = objectMapper;
        this.localCacheService = localCacheService;
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
            throws IOException {
        Set<ImmutablePair<CollectionVersionView, FlowVersionView>> allRequiredFiles =
                Set.of(ImmutablePair.of(collectionVersionView, flowVersionView));

        long startTime = System.currentTimeMillis();
        downloadArtifacts(allRequiredFiles);
        worker.getSandbox().writeContext(context, objectMapper);
        worker.getSandbox().writeConfigs(configs, objectMapper);
        worker.getSandbox()
                .writeEntryPoint(
                        collectionVersionView,
                        flowVersionView,
                        instanceRunView.getInstanceId(),
                        apiUrl,
                        objectMapper);
        worker.getSandbox().writeTriggerPayload(triggerPayload, objectMapper);
        allRequiredFiles.parallelStream()
                .forEach(
                        dependency -> {
                            try {
                                worker.getSandbox().writeFlow(dependency.getRight(), objectMapper);
                                worker.getSandbox().writeCollection(dependency.getLeft(), objectMapper);
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        });

        final Resource workerExecutor = new ClassPathResource(Constants.ACTIVEPIECES_WORKER_JS);
        final File workerExecutorDest =
                new File(worker.getSandbox().getSandboxFilePath(Constants.ACTIVEPIECES_WORKER_JS));
        Files.copy(
                workerExecutor.getInputStream(),
                workerExecutorDest.toPath(),
                StandardCopyOption.REPLACE_EXISTING);
        log.info("Downloading artifacts took {}ms", System.currentTimeMillis() - startTime);
    }

    private void downloadArtifacts(
            Set<ImmutablePair<CollectionVersionView, FlowVersionView>> allRequiredFiles) {
        Set<ImmutablePair<Ksuid, ArtifactMetadata>> allCodeActions =
                allRequiredFiles.stream()
                        .map(
                                f ->
                                        FlowVersionUtil.findAllActions(f.getRight()).stream()
                                                .filter(action -> action instanceof ArtifactMetadata)
                                                .map(action -> (ArtifactMetadata) action)
                                                .map(codeAction -> ImmutablePair.of(f.getRight().getId(), codeAction))
                                                .collect(Collectors.toList()))
                        .flatMap(List::stream)
                        .collect(Collectors.toSet());

        allCodeActions.parallelStream()
                .forEach(
                        codePair -> {
                            try {
                                Ksuid flowVersionId = codePair.getLeft();
                                ArtifactMetadata actionMetadataView = codePair.getRight();
                                String jsFileName =
                                        ArtifactUtils.bundledFileName(
                                                actionMetadataView.getArtifactSettings().getArtifact());
                                InputStream inputStream =
                                        this.localCacheService.cacheArtifact(
                                                flowVersionId,
                                                actionMetadataView,
                                                actionMetadataView.getArtifactSettings().getArtifact());
                                worker.getSandbox().writeCode(jsFileName, inputStream);
                            } catch (CodeArtifactBuildFailure | IOException e) {
                                throw new RuntimeException(e);
                            }
                        });
    }

}

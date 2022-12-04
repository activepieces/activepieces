package com.activepieces.worker.service;

import com.activepieces.actions.code.CodeArtifactService;
import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.CodeArtifactBuildFailure;
import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.worker.workers.CodeBuildWorker;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.jdbc.lock.JdbcLockRegistry;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

@Service
@Log4j2
public class LocalArtifactCacheServiceImpl {

    private final CodeArtifactService codeArtifactService;
    private final JdbcLockRegistry distributedLockService;
    private final ErrorServiceHandler errorServiceHandler;
    private final Map<String, ReentrantLock> lockMap;
    private final CodeBuildService codeBuildService;

    @Autowired
    public LocalArtifactCacheServiceImpl(
            @NonNull final CodeArtifactService codeArtifactService,
            @NonNull final JdbcLockRegistry distributedLockService,
            @NonNull final CodeBuildService codeBuildService,
            @NonNull final ErrorServiceHandler errorServiceHandler) {
        this.lockMap = new ConcurrentHashMap<>();
        this.codeBuildService = codeBuildService;
        this.distributedLockService = distributedLockService;
        this.codeArtifactService = codeArtifactService;
        this.errorServiceHandler = errorServiceHandler;
    }

    public InputStream cacheArtifact(
            Ksuid resourceId,
            ArtifactMetadata artifactMetadata,
            String artifactFileName)
            throws CodeArtifactBuildFailure {
        final ReentrantLock reentrantLock = getLocalLock(artifactFileName);
        try {
            reentrantLock.lock();
            final String packagedPath = artifactMetadata.getPackagePath(resourceId);
            final String sourcePath = artifactMetadata.getSourcePath(resourceId);

            File cachedFile =
                    Path.of("local-code-cache", ArtifactUtils.bundledFileName(artifactFileName)).toFile();
            if (cachedFile.exists()) {
                return new FileInputStream(cachedFile);
            }
            log.info("Failed to found " + cachedFile.getAbsolutePath() + " in local cache");
            if (!codeArtifactService.exists(packagedPath)) {
                log.info(String.format("Build code for raw file path %s", sourcePath));
                CodeBuildWorker codeBuildWorker = codeBuildService.obtainWorker();
                try {
                    buildPackageAndUpload(codeBuildWorker, resourceId, artifactMetadata);
                } finally {
                    codeBuildService.releaseWorker(codeBuildWorker);
                }
            }
            if (cachedFile.exists()) {
                return new FileInputStream(cachedFile);
            }
            log.info("Copying result to cached file " + cachedFile.getAbsolutePath());
            log.info("Downloading from " + packagedPath);
            FileUtils.copyInputStreamToFile(codeArtifactService.getInputStream(packagedPath), cachedFile);
            return new FileInputStream(cachedFile);
        } catch (IOException | InterruptedException exception) {
            throw errorServiceHandler.createInternalError(exception);
        } finally {
            reentrantLock.unlock();
        }
    }

    private synchronized ReentrantLock getLocalLock(String key) {
        lockMap.putIfAbsent(key, new ReentrantLock());
        return lockMap.get(key);
    }

    public void buildPackageAndUpload(
            CodeBuildWorker codeBuildWorker, Ksuid resourceId, ArtifactMetadata artifactMetadata)
            throws CodeArtifactBuildFailure {
        final String packagedPath = artifactMetadata.getPackagePath(resourceId);
        final String sourcePath = artifactMetadata.getSourcePath(resourceId);
        Lock lock = distributedLockService.obtain(packagedPath.hashCode());
        try {
            boolean locked = lock.tryLock(60, TimeUnit.SECONDS);
            if (!locked) {
                throw errorServiceHandler.createInternalError(new RuntimeException("Unable to obtain lock"));
            }
            if (!codeArtifactService.exists(packagedPath)) {
                try {
                    final InputStream sourceStream = codeArtifactService.getInputStream(sourcePath);
                    final InputStream buildStream = codeBuildWorker.build(sourceStream);
                    log.info(String.format("Uploading packaged code to this path %s", packagedPath));
                    codeArtifactService.upload(packagedPath, buildStream);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new CodeArtifactBuildFailure(artifactMetadata.getSourcePath(resourceId), e);
                }
            }
        } catch (InterruptedException e) {
            throw new InternalError(e);
        } finally {
            lock.unlock();
            ;
        }
    }
}

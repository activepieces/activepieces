package com.activepieces.worker.service;

import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.worker.Constants;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Service
public class ComponentServiceImpl {

    private final ObjectMapper objectMapper;

    @Autowired
    public ComponentServiceImpl(@NonNull final ObjectMapper objectMapper){
        this.objectMapper = objectMapper;
    }

    public List<ObjectNode> getApps() throws IOException, InterruptedException {
        final String result = runJs(Constants.WORKER_APPS_ARG);
        return objectMapper.readValue(result, new TypeReference<>(){});
    }

    private String runJs(String args) throws IOException, InterruptedException {
        final Resource workerExecutor = new ClassPathResource(Constants.ACTIVEPIECES_WORKER_JS);
        final File temp = new File(Constants.ACTIVEPIECES_WORKER_JS);
        if(!temp.exists()) {
            Files.copy(
                    workerExecutor.getInputStream(),
                    temp.toPath(),
                    StandardCopyOption.REPLACE_EXISTING);
        }
        return ArtifactUtils.runCommandAsRoot(String.format("node %s %s", Constants.ACTIVEPIECES_WORKER_JS, args));
    }

}

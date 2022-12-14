package com.activepieces.worker.service;

import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.worker.Constants;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.NonNull;
import org.apache.commons.lang.StringEscapeUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ComponentServiceImpl {

    private final ObjectMapper objectMapper;

    @Autowired
    public ComponentServiceImpl(@NonNull final ObjectMapper objectMapper){
        this.objectMapper = objectMapper;
    }

    public List<ObjectNode> getApps() throws IOException, InterruptedException {
        final String result = runJs(Constants.WORKER_APPS_ARG, null);
        return objectMapper.readValue(result, new TypeReference<>(){});
    }

    public List<ObjectNode> getOptions(final String componentName, final String actionName, final String configName,
                                       final Map<String, Object> configs)
            throws IOException, InterruptedException {
        final ObjectNode objectNode = objectMapper.createObjectNode();
        objectNode.put("componentName", componentName);
        objectNode.put("actionName", actionName);
        objectNode.put("configName", configName);
        objectNode.put("configs", objectMapper.convertValue(configs, ObjectNode.class));

        final String result = runJs(Constants.WORKER_OPTIONS_ARG, objectMapper.writeValueAsString(objectNode));
        return objectMapper.readValue(result, new TypeReference<>(){});
    }

    private String runJs(final String args, final String secondArgs) throws IOException, InterruptedException {
        final Resource workerExecutor = new ClassPathResource(Constants.ACTIVEPIECES_WORKER_JS);
        final File temp = new File(Constants.ACTIVEPIECES_WORKER_JS);
        if(!temp.exists()) {
            Files.copy(
                    workerExecutor.getInputStream(),
                    temp.toPath(),
                    StandardCopyOption.REPLACE_EXISTING);
        }
        if(Objects.isNull(secondArgs)){
            return ArtifactUtils.runCommandAsRoot(String.format("node %s %s", Constants.ACTIVEPIECES_WORKER_JS, args));
        }
        return ArtifactUtils.runCommandAsRoot(String.format("node %s %s %s", Constants.ACTIVEPIECES_WORKER_JS,
                args,
                ArtifactUtils.escapeShellDoubleQuoteString(secondArgs, true)));
    }

}

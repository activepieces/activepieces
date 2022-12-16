package com.activepieces.component;

import com.activepieces.common.Constants;
import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.entity.enums.CustomTriggerType;
import com.activepieces.entity.sql.Collection;
import com.activepieces.entity.sql.FlowVersion;
import com.activepieces.flow.model.FlowVersionView;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ComponentService {

    private final ObjectMapper objectMapper;

    @Autowired
    public ComponentService(@NonNull final ObjectMapper objectMapper){
        this.objectMapper = objectMapper;
    }

    public List<ObjectNode> getApps() throws IOException, InterruptedException {
        final String result = runJs(Constants.WORKER_APPS_ARG, null);
        return objectMapper.readValue(result, new TypeReference<>(){});
    }

    public List<Object> getTriggersPayload(
            @NonNull final Object object,
            @NonNull final FlowVersionView flowVersionView,
                                               @NonNull final Map<String, Object> configs){
        // TODO FIX
        return Collections.emptyList();
    }

    public CustomTriggerType getTriggerType(@NonNull final String componentName,
                                            @NonNull final String triggerName) throws IOException, InterruptedException {
        final ObjectNode objectNode = objectMapper.createObjectNode();
        objectNode.put("componentName", componentName);
        objectNode.put("triggerName", triggerName);
        final String result = runJs(Constants.WORKER_TRIGGER_TYPE_ARG, objectMapper.writeValueAsString(objectNode));
        return CustomTriggerType.valueOf(result);
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
        if(Objects.isNull(secondArgs)){
            return ArtifactUtils.runCommandAsRoot(String.format("node %s %s", Constants.ACTIVEPIECES_WORKER_ABS_PATH_JS, args));
        }
        return ArtifactUtils.runCommandAsRoot(String.format("node %s %s %s", Constants.ACTIVEPIECES_WORKER_ABS_PATH_JS,
                args,
                ArtifactUtils.escapeShellDoubleQuoteString(secondArgs, true)));
    }

}

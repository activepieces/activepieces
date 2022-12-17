package com.activepieces.component;

import com.activepieces.common.Constants;
import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.entity.enums.ComponentTriggerHook;
import com.activepieces.entity.enums.ComponentTriggerType;
import com.activepieces.flow.model.FlowVersionView;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ComponentService {

    private final ObjectMapper objectMapper;
    private final String apiPrefix;

    @Autowired
    public ComponentService(@Value("${com.activepieces.api-prefix}") final String apiPrefix,
                            @NonNull final ObjectMapper objectMapper){
        this.objectMapper = objectMapper.copy().setPropertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE);
        this.apiPrefix = apiPrefix;
    }

    public List<ObjectNode> getApps() throws IOException, InterruptedException {
        final String result = runJs(Constants.WORKER_APPS_ARG, null);
        return objectMapper.readValue(result, new TypeReference<>(){});
    }

    public void executeTriggerHook(
            @NonNull final ComponentTriggerHook componentTriggerHook,
            @NonNull final FlowVersionView flowVersion,
            @NonNull final Map<String, Object> configs) throws IOException, InterruptedException {
        final ObjectNode objectNode = objectMapper.createObjectNode();
        objectNode.put("flowVersion",  objectMapper.convertValue(flowVersion, ObjectNode.class));
        objectNode.put("method", componentTriggerHook.equals(ComponentTriggerHook.ENABLED) ? "on-enable" : "on-disable");
        objectNode.put("configs", objectMapper.convertValue(configs, ObjectNode.class));
        objectNode.put("webhookUrl", String.format("%s/flows/%s/webhook", apiPrefix, flowVersion.getFlowId()));
        runJs(Constants.WORKER_EXECUTE_TRIGGER_ARG, objectMapper.writeValueAsString(objectNode));
    }

    public List<Object> getTriggersPayload(
            @NonNull final Object payload,
            @NonNull final FlowVersionView flowVersion,
            @NonNull final Map<String, Object> configs) throws IOException, InterruptedException {
        final ObjectNode objectNode = objectMapper.createObjectNode();
        objectNode.put("payload",  objectMapper.convertValue(payload, ObjectNode.class));
        objectNode.put("method", "run");
        objectNode.put("flowVersion",  objectMapper.convertValue(flowVersion, ObjectNode.class));
        objectNode.put("configs", objectMapper.convertValue(configs, ObjectNode.class));
        objectNode.put("webhookUrl", String.format("%s/flows/%s/webhook", apiPrefix, flowVersion.getFlowId()));
        final String result = runJs(Constants.WORKER_EXECUTE_TRIGGER_ARG, objectMapper.writeValueAsString(objectNode));
        return objectMapper.readValue(result, new TypeReference<>(){});
    }

    public ComponentTriggerType getTriggerType(@NonNull final String componentName,
                                               @NonNull final String triggerName) throws IOException, InterruptedException {
        final ObjectNode objectNode = objectMapper.createObjectNode();
        objectNode.put("componentName", componentName);
        objectNode.put("triggerName", triggerName);
        final String result = runJs(Constants.WORKER_TRIGGER_TYPE_ARG, objectMapper.writeValueAsString(objectNode)).trim();
        return ComponentTriggerType.valueOf(result);
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
                args, ArtifactUtils.escapeShellDoubleQuoteString(secondArgs, true)));
    }

}

package com.activepieces.variable.model;

import com.activepieces.common.error.exception.ConfigNotDynamicException;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.entity.subdocuments.runs.ExecutionStateView;
import com.activepieces.variable.model.exception.MissingConfigsException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface VariableService {

    Map<String, Object> mergeConfigs(Map<String, Object> mainConfig, Map<String, Object> subConfig);

    Map<String, Object> validateAndGetConfigs(List<Variable<?>> pieceConfigs, Map<String,Object> configs) throws MissingConfigsException;

    Map<String, Object> getConfigsWithNoValidate(List<Variable<?>> variablesList, Map<String,Object> configs);

}

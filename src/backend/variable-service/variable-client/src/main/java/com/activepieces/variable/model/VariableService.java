package com.activepieces.variable.model;

import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.variable.model.exception.MissingConfigsException;

import java.util.List;
import java.util.Map;

public interface VariableService {

    Map<String, Object> mergeConfigs(Map<String, Object> mainConfig, Map<String, Object> subConfig);

    Map<String, Object> validateAndGetConfigs(List<Variable<?>> pieceConfigs, Map<String,Object> configs) throws MissingConfigsException;

    Map<String, Object> getConfigsWithNoValidate(List<Variable<?>> variablesList, Map<String,Object> configs);

}

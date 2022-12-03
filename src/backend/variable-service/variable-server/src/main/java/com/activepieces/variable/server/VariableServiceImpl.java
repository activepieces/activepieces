package com.activepieces.variable.server;

import com.activepieces.entity.enums.InputVariableType;
import com.activepieces.entity.enums.VariableSource;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2LoginSettings;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Variable;
import com.activepieces.variable.model.OAuth2Service;
import com.activepieces.variable.model.VariableService;
import com.activepieces.variable.model.exception.MissingConfigsException;
import com.activepieces.worker.service.CodeExecutionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Log
@Service
public class VariableServiceImpl implements VariableService {

  private final ObjectMapper mapper;

  private final OAuth2Service oAuth2Service;
  private final CodeExecutionService codeExecutionService;

  @Autowired
  public VariableServiceImpl(
          ObjectMapper mapper,
          CodeExecutionService codeExecutionService,
          OAuth2Service oAuth2Service) {
    this.codeExecutionService = codeExecutionService;
    this.oAuth2Service = oAuth2Service;
    this.mapper = mapper;
  }

  @Override
  public Map<String, Object> validateAndGetConfigs(
          List<Variable<?>> pieceConfigs, Map<String, Object> configs)
          throws MissingConfigsException {
    ArrayList<String> missingVariables = new ArrayList<>();
    Map<String, Object> clonedConfigs = new HashMap<>(configs);
    List<Variable<?>> mergedList = pieceConfigs;
    for (Variable<?> variableView : mergedList) {
      Object replacedValue = variableView.getValue();
      if (variableView.getSource().equals(VariableSource.USER)) {
        Object value = configs.getOrDefault(variableView.getKey(), replacedValue);
        if (!variableView.validate(value)) {
          missingVariables.add(variableView.getKey());
        } else {
          clonedConfigs.put(variableView.getKey(), refreshVariable(variableView, value));
        }
      } else if (variableView.getSource().equals(VariableSource.PREDEFINED)) {
        clonedConfigs.put(variableView.getKey(), refreshVariable(variableView, replacedValue));
      }
    }
    if (!missingVariables.isEmpty()) {
      throw new MissingConfigsException(missingVariables);
    }
    return clonedConfigs;
  }


  // Input doesn't preserve types after being resolved for example {$step.data} in multi-text field
  // can turn into array, values cannot be validated after resolving.
  @Override
  public Map<String, Object> getConfigsWithNoValidate(
          List<Variable<?>> variablesList, Map<String, Object> configs) {
    Map<String, Object> clonedConfigs = new HashMap<>(configs);
    for (Variable<?> variableView : variablesList) {
      Object replacedValue = variableView.getValue();
      if (variableView.getSource().equals(VariableSource.USER)) {
        Object value = configs.getOrDefault(variableView.getKey(), replacedValue);
        clonedConfigs.put(variableView.getKey(), refreshVariable(variableView, value));
      } else if (variableView.getSource().equals(VariableSource.PREDEFINED)) {
        clonedConfigs.put(variableView.getKey(), refreshVariable(variableView, replacedValue));
      }
    }
    return clonedConfigs;
  }

  private Object refreshVariable(Variable<?> variable, Object value) {
    if (variable.getType().equals(InputVariableType.OAUTH2) && Objects.nonNull(value)) {
      OAuth2Variable oAuth2Variable = (OAuth2Variable) variable;

      if (oAuth2Variable.getSettings() instanceof OAuth2LoginSettings) {
        return oAuth2Service.refreshAndGetAccessToken(
                oAuth2Variable, (Map<String, Object>) value);
      }
    }
    return value;
  }

  @Override
  public Map<String, Object> mergeConfigs(
          Map<String, Object> mainConfig, Map<String, Object> subConfig) {
    final Map<String, Object> configs = new HashMap<>(mainConfig);
    for (String key : subConfig.keySet()) {
      if (!configs.containsKey(key)) {
        configs.put(key, subConfig.get(key));
      }
    }
    return configs;
  }

}

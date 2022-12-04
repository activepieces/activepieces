package com.activepieces.variable.server;

import com.activepieces.entity.enums.InputVariableType;
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
  public Map<String, Object> flatConfigsValue(
          List<Variable> pieceConfigs) {
    Map<String, Object> clonedConfigs = new HashMap<>();
    for (Variable variableView : pieceConfigs) {
      Object replacedValue = variableView.getValue();
      clonedConfigs.put(variableView.getKey(), refreshVariable(variableView, replacedValue));
    }
    return clonedConfigs;
  }


  private Object refreshVariable(Variable variable, Object value) {
    if (variable.getType().equals(InputVariableType.OAUTH2) && Objects.nonNull(value)) {
      OAuth2Variable oAuth2Variable = (OAuth2Variable) variable;

      if (oAuth2Variable.getSettings() instanceof OAuth2LoginSettings) {
        return oAuth2Service.refreshAndGetAccessToken(
                oAuth2Variable, (Map<String, Object>) value);
      }
    }
    return value;
  }


}

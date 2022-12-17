package com.activepieces.variable.server;

import com.activepieces.entity.enums.InputVariableType;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Variable;
import com.activepieces.variable.model.VariableService;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Log
@Service
public class VariableServiceImpl implements VariableService {


  private final OAuth2ServiceImpl oAuth2Service;

  @Autowired
  public VariableServiceImpl(
          OAuth2ServiceImpl oAuth2Service) {
    this.oAuth2Service = oAuth2Service;
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
      return oAuth2Service.refreshToken(
              (OAuth2Variable) variable, (Map<String, Object>) value);
    }
    return value;
  }


}

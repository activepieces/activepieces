package com.activepieces.variable.model;

import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.variable.model.exception.MissingConfigsException;

import java.util.List;
import java.util.Map;

public interface VariableService {

    Map<String, Object> flatConfigsValue(List<Variable> pieceConfigs) throws MissingConfigsException;


}

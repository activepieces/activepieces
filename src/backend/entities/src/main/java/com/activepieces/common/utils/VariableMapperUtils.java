package com.activepieces.common.utils;

import com.activepieces.entity.enums.OAuth2UserType;
import com.activepieces.entity.enums.VariableSource;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2LoginSettings;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Variable;

import java.util.List;
import java.util.stream.Collectors;

public class VariableMapperUtils {

  public static List<Variable<?>> removeSecretInformation(List<Variable<?>> variables) {
    return variables.stream()
        .filter(f -> f.getSource().equals(VariableSource.USER))
        .map(
            f -> {
              if (f instanceof OAuth2Variable) {
                OAuth2Variable oAuth2Variable = (OAuth2Variable) f;
                if (oAuth2Variable.getSettings().getUserInputType().equals(OAuth2UserType.LOGIN)) {
                  OAuth2LoginSettings loginSettings =
                      (OAuth2LoginSettings) oAuth2Variable.getSettings();
                  oAuth2Variable.setSettings(
                      loginSettings.toBuilder()
                          .clientSecret(null)
                          .build());
                }
                return oAuth2Variable;
              }
              return f;
            })
        .collect(Collectors.toList());
  }
}

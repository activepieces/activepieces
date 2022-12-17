package com.activepieces.variable.server;

import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Settings;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Variable;
import com.activepieces.variable.server.strategy.DirectClaimStrategy;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Objects;

@Log4j2
@Service
public class OAuth2ServiceImpl {

  private final DirectClaimStrategy directClaimStrategy;

  @Autowired
  public OAuth2ServiceImpl(
          ObjectMapper objectMapper,
          RestTemplate restTemplate) {
    this.directClaimStrategy = new DirectClaimStrategy(restTemplate, objectMapper);
  }

  public ResponseEntity<?> claimToken(
      String clientId, String clientSecret, String tokenUrl, String authorizationCode, String redirectUrl)
      throws JsonProcessingException {
    return directClaimStrategy.claimToken(clientId, clientSecret, tokenUrl, authorizationCode, redirectUrl);
  }


  public Map<String, Object> refreshToken(
      @NotNull final OAuth2Variable variable, @NotNull final Map<String, Object> oAuth2Response) {
    final String refreshToken = getRefreshToken(oAuth2Response);
    if (Objects.isNull(refreshToken)) {
      return oAuth2Response;
    }
    OAuth2Settings settings = variable.getSettings();
    String clientSecret = settings.getClientSecret();
    Map<String, Object>  refreshedResponse =
                directClaimStrategy.refreshToken(
                        settings.getClientId(),
                        clientSecret,
                        settings.getTokenUrl(),
                        settings.getRefreshUrl(),
                        refreshToken,
                        variable.getSettings().getRedirectUrl());
    refreshedResponse.put("auth_response", oAuth2Response.get("auth_response"));
    return refreshedResponse;
  }

  private static String getRefreshToken(Map<String, Object> objectNode){
    final String refreshToken = "refresh_token";
    if(!objectNode.containsKey(refreshToken)){
      return null;
    }
    return (String) objectNode.get("refresh_token");
  }

}

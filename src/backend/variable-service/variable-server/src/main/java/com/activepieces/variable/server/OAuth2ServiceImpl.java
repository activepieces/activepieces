package com.activepieces.variable.server;

import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Settings;
import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Variable;
import com.activepieces.variable.model.OAuth2Service;
import com.activepieces.variable.server.strategy.Auth2BodyStrategy;
import com.activepieces.variable.server.strategy.Auth2Strategy;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Log4j2
@Service
public class OAuth2ServiceImpl implements OAuth2Service {
  private final ObjectMapper objectMapper;

  private final List<Auth2Strategy> auth2Strategies;
  private final String AUTH_RESPONSE = "auth_response";

  @Autowired
  public OAuth2ServiceImpl(
      ObjectMapper objectMapper,
      RestTemplate restTemplate,
      @Value("${com.activepieces.redirect-url}") String redirectUrl) {
    this.objectMapper = objectMapper;
    this.auth2Strategies = List.of(new Auth2BodyStrategy(restTemplate, redirectUrl, objectMapper));
  }

  @Override
  public ResponseEntity<?> validateAuthorizationCode(
      String clientId, String clientSecret, String tokenUrl, String authorizationCode)
      throws JsonProcessingException {
    ResponseEntity<?> response = null;
    for (Auth2Strategy auth2Strategy : auth2Strategies) {
      try {
        return ResponseEntity.ok(
                    Objects.requireNonNull(
                        auth2Strategy.claimCode(
                            clientId, clientSecret, tokenUrl, authorizationCode)));
      } catch (Exception e) {
        if (e instanceof HttpStatusCodeException) {
          HttpStatus status = ((HttpStatusCodeException) e).getStatusCode();
          ObjectNode body =
              objectMapper.readValue(
                  ((HttpStatusCodeException) e).getResponseBodyAsString(), ObjectNode.class);
          response = ResponseEntity.status(status).body(body);
        }else{
          e.printStackTrace();
        }
      }
    }
    return response;
  }


  @Override
  public Map<String, Object> refreshAndGetAccessToken(
      @NotNull final OAuth2Variable variable, @NotNull final Map<String, Object> oAuth2Response) {
    final String refreshToken = getRefreshToken(oAuth2Response);
    if (Objects.isNull(refreshToken)) {
      return oAuth2Response;
    }
    List<Exception> exceptions = new ArrayList<>();
    OAuth2Settings settings = variable.getSettings();
    String clientSecret = settings.getClientSecret();
    Map<String, Object> refreshedResponse = oAuth2Response;
    for (Auth2Strategy auth2Strategy : auth2Strategies) {
      try {
        refreshedResponse =
                auth2Strategy.refreshToken(
                    settings.getClientId(),
                    clientSecret,
                    settings.getTokenUrl(),
                    settings.getRefreshUrl(),
                        refreshToken);
        refreshedResponse.put(AUTH_RESPONSE, oAuth2Response.get(AUTH_RESPONSE));
      } catch (Exception ignored) {
        exceptions.add(ignored);
      }
    }
    if (getAccessToken(refreshedResponse)
            .equals(getAccessToken(oAuth2Response))) {
      log.error("Refresh failed");
      for (Exception exception : exceptions) {
        log.error(exception);
      }
    }
    return refreshedResponse;
  }

  private static String getRefreshToken(Map<String, Object> objectNode){
    final String refreshToken = "refresh_token";
    if(!objectNode.containsKey(refreshToken)){
      return null;
    }
    return (String) objectNode.get("refresh_token");
  }

  private static String getAccessToken(Map<String, Object> objectNode){
    final String refreshToken = "access_token";
    if(!objectNode.containsKey(refreshToken)){
      return null;
    }
    return (String) objectNode.get("access_token");
  }

}

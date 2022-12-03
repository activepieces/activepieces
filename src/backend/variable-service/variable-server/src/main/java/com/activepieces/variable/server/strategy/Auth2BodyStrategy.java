package com.activepieces.variable.server.strategy;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Map;
import java.util.Objects;

@Log4j2
public class Auth2BodyStrategy implements Auth2Strategy {

  private final RestTemplate restTemplate;
  private final String redirectUrl;
  private final ObjectMapper objectMapper;

  public Auth2BodyStrategy(
      final RestTemplate restTemplate, final String redirectUrl, final ObjectMapper objectMapper) {
    this.restTemplate = restTemplate;
    this.objectMapper = objectMapper;
    this.redirectUrl = redirectUrl;
  }

  @Override
  public Map<String, Object> claimCode(
      String clientId, String clientSecret, String tokenUrl, String authorizationCode)
      throws JsonProcessingException {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
    MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
    map.add("grant_type", "authorization_code");
    map.add("client_id", clientId);
    map.add("client_secret", clientSecret);
    map.add("redirect_uri", redirectUrl);
    map.add("code", authorizationCode);
    // map.add("code_verifier", "lEMSeXaXOAKAw53YlpPK");
    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
    String body = restTemplate.postForObject(URI.create(tokenUrl), request, String.class);
    return objectMapper.convertValue(objectMapper.readValue(body, ObjectNode.class)
            , new TypeReference<>() {
            });
  }

  @Override
  public  Map<String, Object>  refreshToken(
      String clientId, String clientSecret, String tokenUrl, String refreshUrl, String refreshToken)
      throws JsonProcessingException {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
    MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
    map.add("grant_type", "refresh_token");
    map.add("client_id", clientId);
    map.add("client_secret", clientSecret);
    map.add("redirect_uri", redirectUrl);
    map.add("refresh_token", refreshToken);
    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
    String body =
        restTemplate.postForObject(
            URI.create(
                Objects.nonNull(refreshUrl) && refreshUrl.length() > 0 ? refreshUrl : tokenUrl),
            request,
            String.class);
    Map<String, Object> response = objectMapper.convertValue(objectMapper.readValue(body, ObjectNode.class)
            ,new TypeReference<Map<String, Object>>(){});
    response.putIfAbsent("refresh_token", refreshToken);
    return response;
  }
}

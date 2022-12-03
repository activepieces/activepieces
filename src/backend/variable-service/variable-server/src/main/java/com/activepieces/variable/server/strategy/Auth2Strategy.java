package com.activepieces.variable.server.strategy;


import com.fasterxml.jackson.core.JsonProcessingException;

import java.util.Map;

public interface Auth2Strategy {

    Map<String, Object> claimCode(
            String clientId, String clientSecret, String tokenUrl, String authorizationCode) throws JsonProcessingException;

    Map<String, Object> refreshToken(String clientId, String clientSecret, String tokenUrl, String refreshUrl, String refreshToken) throws JsonProcessingException;
}

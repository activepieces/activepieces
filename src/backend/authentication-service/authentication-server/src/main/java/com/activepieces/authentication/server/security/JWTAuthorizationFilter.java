package com.activepieces.authentication.server.security;

import com.activepieces.apikey.client.ApiKeyService;
import com.activepieces.common.identity.PrincipleIdentity;
import com.activepieces.authentication.client.util.JWTUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

public class JWTAuthorizationFilter extends BasicAuthenticationFilter {


  private final HandlerExceptionResolver resolver;
  private final ApiKeyService apiKeyService;

  public JWTAuthorizationFilter(
      ApiKeyService apiKeyService,
      AuthenticationManager authenticationManager,
      HandlerExceptionResolver resolver) {
    super(authenticationManager);
    this.resolver = resolver;
    this.apiKeyService = apiKeyService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws IOException, ServletException {

    String token = req.getHeader(JWTUtils.AUTHORIZATION_HEADER_NAME);
    UsernamePasswordAuthenticationToken authentication = getAuthentication(token);
    if (authentication == null) {
      chain.doFilter(req, res);
      return;
    }

    SecurityContextHolder.getContext().setAuthentication(authentication);
    chain.doFilter(req, res);
  }

  private UsernamePasswordAuthenticationToken getAuthentication(final String token) {
    if (token == null) {
      return null;
    }
    Optional<PrincipleIdentity> resourceToken =
        JWTUtils.decodeIdentityFromToken(
            token, apiKeyService);

    return resourceToken
        .map(
            identity ->
                new UsernamePasswordAuthenticationToken(
                    identity,
                    null,
                    Collections.singletonList(
                        new SimpleGrantedAuthority(identity.getPrincipleType().getType()))))
        .orElse(null);
  }
}

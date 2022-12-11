package com.activepieces.authentication.client;

import com.activepieces.common.identity.*;
import com.activepieces.flag.service.FlagService;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTDecodeException;
import com.auth0.jwt.exceptions.SignatureVerificationException;
import com.auth0.jwt.exceptions.TokenExpiredException;
import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Date;
import java.util.Objects;
import java.util.Optional;

import static com.auth0.jwt.algorithms.Algorithm.HMAC512;

@Service
public class JWTService {

  public static final String AUTHORIZATION_HEADER_NAME = "Authorization";
  public static final String TOKEN_PREFIX = "Bearer ";
  public static final Duration DEFAULT_EXPIRATION_DURATION = Duration.ofDays(7);
  private static final String RESOURCE_ROLE = "role";
  private static final String COLLECTION_ID = "collection_id";
  private static final String FLOW_ID = "flow_id";

  private String secretKey;

  public JWTService(@NonNull final FlagService flagService){
    if(!flagService.exists(FlagService.BEARER_ENCRYPTION_KEY)){
      secretKey = RandomStringUtils.randomAlphanumeric(35);
      flagService.save(FlagService.BEARER_ENCRYPTION_KEY, secretKey);
    }else{
      secretKey = flagService.getValue(FlagService.BEARER_ENCRYPTION_KEY).get();
    }
  }

  public String createTokenWithExpirationPeriod(
          @NonNull final UserIdentity userIdentity, final Duration duration) {
    return JWT.create()
            .withSubject(userIdentity.getId().toString())
            .withClaim(RESOURCE_ROLE, userIdentity.getPrincipleType().toString())
            .withExpiresAt(new Date(System.currentTimeMillis() + duration.getSeconds() * 1000L))
            .sign(HMAC512(secretKey.getBytes()));
  }


  public String createTokenWithDefaultExpiration(
          @NonNull final WorkerIdentity workerIdentity) {
    return JWT.create()
        .withSubject(workerIdentity.getId().toString())
        .withClaim(RESOURCE_ROLE, workerIdentity.getPrincipleType().toString())
        .withClaim(COLLECTION_ID, workerIdentity.getCollectionId().toString())
        .withClaim(FLOW_ID, workerIdentity.getFlowId().toString())
        .withExpiresAt(
            new Date(System.currentTimeMillis() + DEFAULT_EXPIRATION_DURATION.getSeconds() * 1000L))
        .sign(HMAC512(secretKey.getBytes()));
  }

  public String createTokenWithDefaultExpiration(@NonNull final UserIdentity userIdentity) {
    return createTokenWithExpirationPeriod(userIdentity, DEFAULT_EXPIRATION_DURATION);
  }

  public Optional<PrincipleIdentity> decodeIdentityFromToken(
          @NonNull final String rawToken)  {
    try {
      final String strippedToken = rawToken.replace(TOKEN_PREFIX, "");
      final DecodedJWT decodedJWT = JWT.decode(strippedToken);
      final Claim resourceType = decodedJWT.getClaim(RESOURCE_ROLE);
      if (!resourceType.isNull()) {
        final String resourceIdString =
                JWT.require(Algorithm.HMAC512(secretKey.getBytes()))
                        .build()
                        .verify(strippedToken)
                        .getSubject();
        final Ksuid resourceId = Ksuid.fromString(resourceIdString);
        final PrincipleType principleType = PrincipleType.valueOf(resourceType.asString());
        if (principleType.equals(PrincipleType.USER)) {
          return Optional.of(UserIdentity.builder().resourceId(resourceId).build());
        } else if (principleType.equals(PrincipleType.WORKER)) {
          WorkerIdentity.WorkerIdentityBuilder builder =
              WorkerIdentity.builder()
                  .flowId(Ksuid.fromString(decodedJWT.getClaim(FLOW_ID).asString()))
                  .collectionId(Ksuid.fromString(decodedJWT.getClaim(COLLECTION_ID).asString()));
          return Optional.of(builder.build());
        }
      }
    } catch (TokenExpiredException
            | JWTDecodeException
            |IllegalArgumentException
            | SignatureVerificationException ignored) {
    }
    return Optional.empty();
  }
}

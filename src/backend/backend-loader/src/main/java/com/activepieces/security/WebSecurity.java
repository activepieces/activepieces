package com.activepieces.security;

import com.activepieces.apikey.client.ApiKeyService;
import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.server.security.JWTAuthorizationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Configuration
@EnableWebSecurity
public class WebSecurity extends WebSecurityConfigurerAdapter {

  public static final String AUTHORIZATION_HEADER_NAME = "Authorization";

  private final ApiKeyService apiKeyService;
  private final HandlerExceptionResolver resolver;

  @Autowired
  public WebSecurity(
      final ApiKeyService apiKeyService,
      @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
    this.apiKeyService = apiKeyService;
    this.resolver = resolver;
  }

  @Override
  protected void configure(HttpSecurity httpSecurity) throws Exception {
    httpSecurity.httpBasic();
    httpSecurity
        .cors()
        .and()
        .csrf()
        .disable()
        .authorizeRequests()
        .antMatchers(HttpMethod.GET, "/api-docs")
        .permitAll()
        .antMatchers(HttpMethod.GET, "/health")
        .permitAll()
        .antMatchers(HttpMethod.POST, "/webhook")
        .permitAll()
        .antMatchers(HttpMethod.POST, "/authentication/*")
        .permitAll()
        .antMatchers(HttpMethod.POST, "/instances/*/flows/*/runs")
        .permitAll()
        .antMatchers(HttpMethod.POST, "/projects/*/authenticate")
        .permitAll()
        .antMatchers(HttpMethod.GET, "/users/*")
        .permitAll()
        .anyRequest()
        .authenticated()
        .and()
        .addFilter(
            new JWTAuthorizationFilter(
                apiKeyService,
                authenticationManager(),
                resolver))
        .sessionManagement()
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS);
  }


  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration().applyPermitDefaultValues();
    configuration.addExposedHeader(AUTHORIZATION_HEADER_NAME);
    configuration.addAllowedOrigin("*");
    configuration.addAllowedHeader("*");
    configuration.addAllowedMethod("*");
    final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}

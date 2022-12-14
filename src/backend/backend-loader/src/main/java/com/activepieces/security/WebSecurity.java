package com.activepieces.security;

import com.activepieces.authentication.client.JWTService;
import com.activepieces.authentication.server.security.JWTAuthorizationFilter;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Configuration
@EnableWebSecurity
public class WebSecurity extends WebSecurityConfigurerAdapter {

    public static final String AUTHORIZATION_HEADER_NAME = "Authorization";

    private final HandlerExceptionResolver resolver;
    private final JWTService jwtService;

    @Autowired
    public WebSecurity(
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver,
            @NonNull final JWTService jwtService) {
        this.resolver = resolver;
        this.jwtService = jwtService;
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
                .antMatchers(HttpMethod.GET, "/files/*")
                .permitAll()
                .antMatchers(HttpMethod.GET, "/api-docs")
                .permitAll()
                .antMatchers(HttpMethod.GET, "/health")
                .permitAll()
                .antMatchers(HttpMethod.POST, "/webhook")
                .permitAll()
                .antMatchers(HttpMethod.POST, "/authentication/*")
                .permitAll()
                .antMatchers(HttpMethod.GET, "/options")
                .permitAll()
                .antMatchers(HttpMethod.POST, "/instances/*/flows/*/runs")
                .permitAll()
                .anyRequest()
                .authenticated()
                .and()
                .addFilter(
                        new JWTAuthorizationFilter(
                                jwtService,
                                authenticationManager()))
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

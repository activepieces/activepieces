package com.activepieces.security;/*
 * #%L
 * Summer
 * %%
 * Copyright (C) 2018 GreenEyed (Daniel Lopez)
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 2.1 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Lesser Public License for more details.
 * 
 * You should have received a copy of the GNU General Lesser Public
 * License along with this program.  If not, see
 * <http://www.gnu.org/licenses/lgpl-2.1.html>.
 * #L%
 */


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

/**
 * The class that configures a servlet that adds a key to the Mapped Diagnostic Context (MDC) to each request so you can print a unique id in the logg
 * messages of each request. It also add the key as a header in the response so the caller of the request can provide you the id to browse the logs.
 * Set the response header name to null/blank if you want the response to NOT include such header.
 * 
 * If you provide a request header name, the filter will check first if the request contains a header with that name and will use the ID it provides.
 * This is useful if your application chain has already assigned an id to the "transaction". (Microservices, apps behind a proxy/gateway service...)
 * 
 * The MDC key and the header names are configurable.
 * 
 * Here's a configuration sample with the default values:
 * 
 * <pre>
 * summer:
 *   slf4jfilter:
 *     response_header: Response_Token
 *     mdc_token_key: Slf4jMDCFilter.UUID
 *     mdc_client_ip_key: Slf4jMDCFilter.ClientIP
 *     request_header:
 * </pre>
 **/
@Data
@Configuration
@ConfigurationProperties(prefix = "summer.slf4jfilter")
public class Slf4jMDCFilterConfiguration {

    public static final String DEFAULT_RESPONSE_TOKEN_HEADER = "Request-id";

    private String responseHeader = DEFAULT_RESPONSE_TOKEN_HEADER;
    private String requestHeader = null;
    private String mdcTokenKey;
    private String mcTokenPrefix;

    @Autowired
    public Slf4jMDCFilterConfiguration(@Value("${logging.request-id-header}") String mdcTokenKey,
                                       @Value("${logging.api-pattern}") String mcTokenPrefix){
        this.mdcTokenKey = mdcTokenKey;
        this.mcTokenPrefix = mcTokenPrefix;
    }

    @Bean
    public FilterRegistrationBean<Slf4jMDCFilter> servletRegistrationBean() {
        final FilterRegistrationBean<Slf4jMDCFilter> registrationBean = new FilterRegistrationBean<>();
        final Slf4jMDCFilter log4jMDCFilterFilter = new Slf4jMDCFilter(responseHeader, mdcTokenKey, mcTokenPrefix, requestHeader);
        registrationBean.setFilter(log4jMDCFilterFilter);
        registrationBean.setOrder(2);
        return registrationBean;
    }
}
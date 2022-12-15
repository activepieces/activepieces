package com.activepieces.config;

import com.activepieces.common.id.APIdSerializer;
import com.activepieces.common.pagination.Cursor;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.github.ksuid.Ksuid;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;
import java.util.Objects;

@Configuration
@Log4j2
public class WebConfigConverter extends WebMvcConfigurationSupport {

    @Override
    protected void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        super.addArgumentResolvers(argumentResolvers);
        argumentResolvers.add(new AuthenticationPrincipalArgumentResolver());
    }

    @Bean(name = "jsonMapper")
    @Primary
    public ObjectMapper jsonMapper() {
        SimpleModule simpleModule = new SimpleModule("SimpleModule");
        simpleModule.addSerializer(Ksuid.class, new APIdSerializer());
        return new ObjectMapper().registerModule(simpleModule)
                .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }

    @Override
    protected void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        super.configureMessageConverters(converters);
        converters.add(new MappingJackson2HttpMessageConverter(jsonMapper()));
    }

    @Override
    protected void addFormatters(FormatterRegistry registry) {
        super.addFormatters(registry);
        log.info("Added formatter packages");
        registry.addConverter(new StringToCursorConverter());
        registry.addConverter(new StringToKsuidConvertor());
    }
}

class StringToKsuidConvertor implements Converter<String, Ksuid> {

    @Override
    public Ksuid convert(String param) {
        if(Objects.isNull(param)){
            return null;
        }
        return Ksuid.fromString(param);
    }
}



class StringToCursorConverter implements Converter<String, Cursor> {
    @Override
    public Cursor convert(String param) {
        if(Objects.isNull(param)){
            return null;
        }
        return new Cursor(param);
    }
}



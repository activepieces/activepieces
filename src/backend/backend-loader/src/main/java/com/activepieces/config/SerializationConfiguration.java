package com.activepieces.config;

import com.activepieces.common.identity.APIdSerializer;
import com.fasterxml.jackson.core.Version;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.github.ksuid.Ksuid;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class SerializationConfiguration implements WebMvcConfigurer {

    @Bean(name = "jsonMapper")
    @Primary
    public ObjectMapper jsonMapper() {
        SimpleModule simpleModule = new SimpleModule("SimpleModule");
        simpleModule.addSerializer(Ksuid.class, new APIdSerializer());
        return new ObjectMapper().registerModule(simpleModule)
                .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    }

    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        converters.add(new MappingJackson2HttpMessageConverter(jsonMapper()));
    }
}

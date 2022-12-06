package com.activepieces.config;

import com.activepieces.common.pagination.Cursor;
import com.github.ksuid.Ksuid;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Objects;

@Configuration
@Log4j2
public class WebConfigConverter implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
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



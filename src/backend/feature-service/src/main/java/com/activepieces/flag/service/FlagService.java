package com.activepieces.flag.service;

import com.activepieces.entity.sql.FlagValue;
import com.activepieces.flag.repository.FlagRepository;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.Optional;

@Service
public class FlagService {

    public static final String BEARER_ENCRYPTION_KEY = "BEARER_ENCRYPTION_KEY";

    private final FlagRepository flagRepository;

    @Autowired
    public FlagService(@NonNull final FlagRepository flagRepository){
        this.flagRepository = flagRepository;
    }

    public Optional<String> getValue(@NonNull final String key){
        Optional<FlagValue> result = flagRepository.findById(key);
        if(result.isEmpty()){
            return Optional.empty();
        }
        return Optional.of(result.get().getValue());
    }

    public boolean exists(@NonNull final String key){
        return flagRepository.existsById(key);
    }

    public void save(@NonNull final String key,
                     @NonNull final String value){
        flagRepository.save(FlagValue.builder().key(key).value(value).build());
    }
}

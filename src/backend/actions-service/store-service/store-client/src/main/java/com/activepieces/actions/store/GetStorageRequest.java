package com.activepieces.actions.store;

import com.activepieces.entity.enums.StoreScope;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@SuperBuilder
public class GetStorageRequest {

    @JsonProperty
    @NotNull
    private StoreScope scope;

    @JsonProperty
    @NotNull
    private List<String> storePath;
}

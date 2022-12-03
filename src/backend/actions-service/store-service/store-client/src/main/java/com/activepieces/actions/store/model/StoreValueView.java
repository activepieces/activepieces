package com.activepieces.actions.store.model;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StoreValueView {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String id;

    @JsonProperty
    @NotNull
    private String key;

    @JsonProperty
    @NotNull
    private Object value;

    @JsonIgnore private long epochCreationTime;

    @JsonIgnore private long epochUpdateTime;
}

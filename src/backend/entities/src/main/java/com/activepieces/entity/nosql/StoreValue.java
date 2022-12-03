package com.activepieces.entity.nosql;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.checkerframework.common.aliasing.qual.Unique;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Id;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document("store")
public class StoreValue {

    @JsonProperty
    @Id
    private String id;

    @JsonProperty
    private String key;

    @JsonProperty
    private Object value;

    @JsonProperty private long epochCreationTime;

    @JsonProperty private long epochUpdateTime;

}

package com.activepieces.entity.nosql;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Id;
import java.util.List;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
@Document("collection")
public class Collection implements EntityMetadata {
    public static final String PROJECT_ID = "projectId";

    @JsonProperty
    @Id
    private UUID id;

    @JsonProperty
    private String name;

    @JsonProperty
    private UUID projectId;

    @JsonProperty private List<UUID> versionsList;

    @JsonProperty private long epochCreationTime;

    @JsonProperty private long epochUpdateTime;

}

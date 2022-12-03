package com.activepieces.entity.nosql;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Id;
import java.util.List;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
@Document("flow")
public class Flow implements EntityMetadata {

  public static final String COLLECTION_ID = "collectionId";

  @JsonProperty @Id private UUID id;

  @JsonProperty private String name;

  @JsonProperty @Indexed private UUID collectionId;

  @JsonProperty private List<UUID> versionsList;

  @JsonProperty private long epochUpdateTime;

  @JsonProperty private long epochCreationTime;


}

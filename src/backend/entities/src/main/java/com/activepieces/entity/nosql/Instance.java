package com.activepieces.entity.nosql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.InstanceStatus;
import com.bol.secure.Encrypted;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.mongodb.core.index.IndexDirection;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Id;
import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document("instance")
public class Instance implements EntityMetadata {


  public static final String PROJECT_ID = "projectId";
  public static final String STATUS = "status";

  @JsonProperty @Id private UUID id;

  @Indexed(name = "instance_collection_version_id_index", direction = IndexDirection.ASCENDING)
  @JsonProperty
  private UUID collectionVersionId;

  @Indexed(name = "instance_project_id_index", direction = IndexDirection.ASCENDING)
  @JsonProperty
  private UUID projectId;

  @Encrypted @JsonProperty private Map<String, Object> configs;

  @JsonProperty private long epochCreationTime;

  @JsonProperty private long epochUpdateTime;

  @JsonProperty private InstanceStatus status;

}

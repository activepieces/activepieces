package com.activepieces.entity.nosql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.FlowExecutionStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.IndexDirection;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Id;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document("instance_run_log")
@CompoundIndexes({
  @CompoundIndex(
      name = "runs_pagination_index",
      def = "{ 'projectId' : 1, 'epochCreationTime': 1, 'instanceId': 1}")
})
public class InstanceRun implements EntityMetadata {

  public static final String INSTANCE_ID = "instanceId";

  public static final String PROJECT_ID = "projectId";

  @JsonProperty @Id private UUID id;

  @JsonProperty
  @Indexed(name = "run_instance_id_index", direction = IndexDirection.ASCENDING)
  private UUID instanceId;

  @JsonProperty private UUID projectId;

  @JsonProperty private UUID flowVersionId;

  @JsonProperty private UUID collectionVersionId;

  @JsonProperty private FlowExecutionStatus status;

  @JsonProperty private String flowDisplayName;

  @JsonProperty private String collectionDisplayName;

  @JsonProperty private UUID logsFileId;

  @JsonIgnore private long epochCreationTime;

  @JsonIgnore private long epochUpdateTime;

  @JsonProperty private long epochFinishTime;

  @JsonProperty private long epochStartTime;

}

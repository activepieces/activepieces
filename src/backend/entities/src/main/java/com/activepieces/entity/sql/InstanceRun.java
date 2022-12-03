package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.FlowExecutionStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.*;

import javax.persistence.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table( name = "instance_run_log", indexes = {@Index(name = "run_instance_id_index", columnList = "instance_id", unique = false)})
public class InstanceRun implements EntityMetadata {

  public static final String INSTANCE_ID = "instanceId";

  public static final String PROJECT_ID = "projectId";

  @JsonProperty @Id private Ksuid id;

  @Column(name = "instance_id")
  private Ksuid instanceId;

  @Column(name = "project_id")
  private Ksuid projectId;

  @Column(name = "flow_version_id")
  private Ksuid flowVersionId;

  @Column(name = "collection_version_id")
  private Ksuid collectionVersionId;

  @Column(name = "status")
  private FlowExecutionStatus status;

  @Column(name = "flow_display_name")
  private String flowDisplayName;

  @Column(name = "collection_display_name")
  private String collectionDisplayName;

  @Column(name = "logs_file_id")
  private Ksuid logsFileId;

  @Column(name = "epoch_creation_time")
  private long epochCreationTime;

  @Column(name = "epoch_update_time")
  private long epochUpdateTime;

  @Column(name = "epoch_finish_time")
  private long epochFinishTime;

  @Column(name = "epoch_start_time")
  private long epochStartTime;

}

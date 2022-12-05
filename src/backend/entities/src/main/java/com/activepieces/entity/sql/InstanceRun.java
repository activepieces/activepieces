package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.FlowExecutionStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.*;

import javax.persistence.*;
import java.time.Instant;

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

  @Column(name = "collection_id")
  private Ksuid collectionId;

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

  @Column(name = "finish_time")
  private long finishTime;

  @Column(name = "start_time")
  private long startTime;

  @Column(name = "created", nullable = false)
  private long created;

  @Column(name = "updated", nullable = false)
  private long updated;


  @PrePersist
  protected void onCreate() {
    long currentMs = Instant.now().toEpochMilli();
    created = currentMs;
    updated = currentMs;
  }

  @PreUpdate
  protected void onUpdate() {
    updated = Instant.now().toEpochMilli();
  }

}

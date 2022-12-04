package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.InstanceStatus;
import com.github.ksuid.Ksuid;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.*;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.*;
import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table( name = "instance")
@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)
public class Instance implements EntityMetadata {

  public static final String PROJECT_ID = "projectId";
  public static final String COLLECTION_ID = "collectionId";
  public static final String STATUS = "status";

  @Id private Ksuid id;

  @Column(name = "collection_id")
  private Ksuid collectionId;


  @Column(name = "collection_version_id")
  private Ksuid collectionVersionId;

  @Column(name = "project_id")
  private Ksuid projectId;

  @Column(name = "status")
  private InstanceStatus status;

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

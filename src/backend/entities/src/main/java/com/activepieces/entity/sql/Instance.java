package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.InstanceStatus;
import com.github.ksuid.Ksuid;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.*;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
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
  public static final String STATUS = "status";

  @Id private Ksuid id;

  @Column(name = "collection_version_id")
  private Ksuid collectionVersionId;

  @Column(name = "project_id")
  private Ksuid projectId;

  @Type(type = "jsonb")
  @Column(name = "configs", columnDefinition = "jsonb")
  private Map<String, Object> configs;

  @Column(name = "epoch_creation_time")
  private long epochCreationTime;

  @Column(name = "epoch_update_time")
  private long epochUpdateTime;

  @Column(name = "status")
  private InstanceStatus status;

}

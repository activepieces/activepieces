package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
@Entity
@Table(name = "flow", indexes = {@Index(name = "flow_collection_id_index", columnList = "collection_id", unique = false)})
public class Flow implements EntityMetadata {

  public static final String COLLECTION_ID = "collectionId";

  @Id private Ksuid id;

  @Column(name = "name")
  private String name;

  @Column(name = "collection_id")
  private Ksuid collectionId;

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

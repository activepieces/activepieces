package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.subdocuments.field.Variable;
import com.github.ksuid.Ksuid;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.*;
import java.time.Instant;
import java.util.List;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "collection_version", indexes = {@Index(name = "collection_id_index", columnList = "collection_id", unique = false)})
@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)
public class CollectionVersion implements EntityMetadata {

  @Id private Ksuid id;

  @Column(name = "display_name")
  private String displayName;

  @Column(name = "collection_id")
  private Ksuid collectionId;

  @Type(type = "jsonb")
  @Column(name = "configs", columnDefinition = "jsonb")
  private List<Variable> configs;

  @Column(name = "state")
  @Enumerated(EnumType.STRING)
  private EditState state;

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

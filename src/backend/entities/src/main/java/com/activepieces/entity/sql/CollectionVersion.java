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
  private List<Variable<?>> configs;

  @Column(name = "epoch_creation_time")
  private long epochCreationTime;

  @Column(name = "epoch_update_time")
  private long epochUpdateTime;

  @Column(name = "state")
  private EditState state;

}

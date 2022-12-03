package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.github.ksuid.Ksuid;
import lombok.*;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "project")
public class Project implements EntityMetadata {
  @Id
  @Column(name = "id")
  private Ksuid id;

  @Column(name = "owner_id")
  private Ksuid ownerId;

  @Column(name = "display_name")
  private String displayName;

  @Column(name = "creation_time")
  private long epochCreationTime;

  @Column(name = "update_time")
  private long epochUpdateTime;


}

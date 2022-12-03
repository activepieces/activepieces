package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import lombok.*;
import org.checkerframework.common.aliasing.qual.Unique;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import javax.persistence.*;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "project")
public class Project implements EntityMetadata {
  @Id
  @GeneratedValue(generator = "uuid2")
  @GenericGenerator(name = "uuid2", strategy = "uuid2")
  @Column(name = "id")
  private UUID id;

  @Column(name = "owner_id")
  private UUID ownerId;

  @Column(name = "display_name")
  private String displayName;

  @Column(name = "logo_url")
  private String logoUrl;

  @Column(name = "creation_time")
  private long epochCreationTime;

  @Column(name = "update_time")
  private long epochUpdateTime;


}

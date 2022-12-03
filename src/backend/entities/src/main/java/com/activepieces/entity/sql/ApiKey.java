package com.activepieces.entity.sql;

import com.activepieces.common.AttributeEncryptor;
import com.activepieces.common.EntityMetadata;
import lombok.*;
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
@Table(name = "api_key")
public class ApiKey implements EntityMetadata {

  public static final String PROJECT_ID = "projectId";

  @Id
  @GeneratedValue(generator = "uuid2")
  @GenericGenerator(name = "uuid2", strategy = "uuid2")
  @Column(name = "id")
  private UUID id;

  @Column(name = "project_id")
  private UUID projectId;

  @Column(name = "name")
  private String name;

  @Column(name = "secret")
  @Convert(converter = AttributeEncryptor.class)
  private String secret;

  @Column(name = "creation_time")
  private long epochCreationTime;

  @Column(name = "update_time")
  private long epochUpdateTime;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", insertable = false, updatable = false)
  private Project project;
}

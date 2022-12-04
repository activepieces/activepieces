package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
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
@Table(name = "project")
public class Project implements EntityMetadata {
  @Id
  @Column(name = "id")
  private Ksuid id;

  @Column(name = "owner_id")
  private Ksuid ownerId;

  @Column(name = "display_name")
  private String displayName;

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

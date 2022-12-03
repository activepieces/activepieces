package com.activepieces.entity.sql;

import com.activepieces.entity.enums.Role;
import lombok.*;

import javax.persistence.*;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "resource_access")
@IdClass(ResourceAccessId.class)
public class ResourceAccess {

  @Column(name = "resource_id") @Id private UUID resourceId;

  @Column(name = "principle_id") @Id private UUID principleId;

  @Column
  @Enumerated(EnumType.STRING)
  private Role role;
}

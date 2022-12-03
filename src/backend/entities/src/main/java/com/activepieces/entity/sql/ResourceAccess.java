package com.activepieces.entity.sql;

import com.activepieces.entity.enums.Role;
import com.github.ksuid.Ksuid;
import lombok.*;

import javax.persistence.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "resource_access")
@IdClass(ResourceAccessId.class)
public class ResourceAccess {

  @Column(name = "resource_id") @Id private Ksuid resourceId;

  @Column(name = "principle_id") @Id private Ksuid principleId;

  @Column
  @Enumerated(EnumType.STRING)
  private Role role;
}

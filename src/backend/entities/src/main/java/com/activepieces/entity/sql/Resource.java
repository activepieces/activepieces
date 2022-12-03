package com.activepieces.entity.sql;

import com.activepieces.entity.enums.ResourceType;
import lombok.*;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "resource")
public class Resource {

  @Column(name = "resource_id") @Id private UUID resourceId;

  @Column(name = "resource_type") private ResourceType resourceType;

  @Column(name = "parent_resource_id") private UUID parentResourceId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name="parent_resource_id", insertable = false, updatable = false)
  private Resource parent;

  @OneToMany(mappedBy="parent", fetch = FetchType.LAZY)
  private Set<Resource> children = new HashSet<Resource>();


}

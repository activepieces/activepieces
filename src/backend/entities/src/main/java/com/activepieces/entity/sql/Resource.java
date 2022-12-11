package com.activepieces.entity.sql;

import com.activepieces.entity.enums.ResourceType;
import com.github.ksuid.Ksuid;
import lombok.*;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "resource")
public class Resource {

  @Column(name = "resource_id") @Id private Ksuid resourceId;

  @Column(name = "resource_type")
  @Enumerated(EnumType.STRING)
  private ResourceType resourceType;

  @Column(name = "parent_resource_id") private Ksuid parentResourceId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name="parent_resource_id", insertable = false, updatable = false)
  private Resource parent;

  @OneToMany(mappedBy="parent", fetch = FetchType.LAZY)
  private Set<Resource> children = new HashSet<Resource>();


}

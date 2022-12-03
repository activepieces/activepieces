package com.activepieces.entity.sql;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
public class ResourceAccessId implements Serializable {

  private UUID resourceId;
  private UUID principleId;
}

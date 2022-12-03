package com.activepieces.entity.sql;

import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@AllArgsConstructor
@NoArgsConstructor
public class ResourceAccessId implements Serializable {

  private Ksuid resourceId;
  private Ksuid principleId;
}

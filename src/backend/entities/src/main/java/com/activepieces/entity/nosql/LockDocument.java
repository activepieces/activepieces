package com.activepieces.entity.nosql;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Id;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "distributed_lock")
public class LockDocument {

  @Id private String id;

  private long expireAt;

  private String token;
}

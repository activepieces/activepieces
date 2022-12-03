package com.activepieces.entity.nosql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.subdocuments.field.Variable;
import com.bol.secure.Encrypted;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.index.IndexDirection;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Id;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@NoArgsConstructor
@Getter
@Setter
@Document("collection_version")
public class CollectionVersion implements EntityMetadata {

  @JsonProperty @Id private UUID id;

  @JsonProperty private String displayName;

  @JsonProperty private String logoUrl;

  @JsonProperty
  @Indexed(name = "collection_id_index", direction = IndexDirection.ASCENDING)
  private UUID collectionId;

  @Encrypted
  @JsonProperty private List<Variable<?>> configs;

  @JsonProperty private Set<UUID> flowsVersionId;

  @JsonProperty private String description;

  @JsonProperty private long epochCreationTime;

  @JsonProperty private long epochUpdateTime;

  @JsonProperty
  private EditState state;

}

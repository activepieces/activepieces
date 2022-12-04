package com.activepieces.entity.sql;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.*;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "store")
@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)
public class StoreValue {

    @JsonProperty
    @Id
    @Column(name = "id")
    private String id;

    @JsonProperty
    @Column(name = "key")
    private String key;

    @JsonProperty
    @Type(type = "jsonb")
    @Column(name = "value", columnDefinition = "jsonb")
    private Object value;

    @JsonProperty private long created;

    @JsonProperty private long updated;

}

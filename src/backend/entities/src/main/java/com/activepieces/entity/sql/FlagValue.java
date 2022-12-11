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
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "flag")
public class FlagValue {

    @JsonProperty
    @Id
    @Column(name = "id")
    private String key;

    @JsonProperty
    @Column(name = "value")
    private String value;

}

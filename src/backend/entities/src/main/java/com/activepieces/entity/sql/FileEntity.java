package com.activepieces.entity.sql;


import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "FILES", indexes = {@Index(name = "name_index", columnList = "name", unique = true)})
public class FileEntity {

    @Id
    private Ksuid id;

    @Column(name = "name")
    private String name;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "size")
    private Long size;

    @Lob
    private byte[] data;


}

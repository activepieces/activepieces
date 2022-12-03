package com.activepieces.entity.subdocuments.field.connection.apikey;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyValue {

    @JsonProperty
    private String header;

    @JsonProperty
    private String value;



}

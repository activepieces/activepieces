package com.activepieces.action.component;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ComponentManifestView {

    @JsonProperty
    public String name;

    @JsonProperty
    private String version;

    @JsonProperty("package")
    public PackageView npmPackage;

}

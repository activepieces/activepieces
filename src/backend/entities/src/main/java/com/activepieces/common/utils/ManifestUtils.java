package com.activepieces.common.utils;

public class ManifestUtils {

    private static final String CDN_MANIFEST_URL =
            "https://cdn.activepieces.com/components/%s/%s.json";

    public static String getManifestUrl(String componentName, String componentVersion){
        return String.format(
                CDN_MANIFEST_URL,
                StringUtils.camelCaseToSnakeCase(componentName),
                componentVersion);
    }


}

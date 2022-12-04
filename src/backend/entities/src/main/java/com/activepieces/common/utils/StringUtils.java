package com.activepieces.common.utils;

import com.google.common.base.CaseFormat;
import org.springframework.stereotype.Service;

@Service
public final class StringUtils {

  public static String camelCaseToSnakeCase(final String camelCase) {
    return CaseFormat.UPPER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, camelCase);
  }
}

package com.activepieces.common.validation;

import lombok.NoArgsConstructor;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.Objects;

@NoArgsConstructor
public class CronExpressionValidator implements ConstraintValidator<CronExpression, String> {

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (Objects.isNull(value)){
      return false;
    }
    return org.quartz.CronExpression.isValidExpression(value);
  }
}

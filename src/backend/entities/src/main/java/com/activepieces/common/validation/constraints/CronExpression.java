package com.activepieces.common.validation.constraints;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({ FIELD })
@Retention(RUNTIME)
@Constraint(validatedBy = CronExpressionValidator.class)
@Documented
public @interface CronExpression {

  String message() default "cronExpression is invalid";

  Class<?>[] groups() default { };

  Class<? extends Payload>[] payload() default { };

}
package com.activepieces.common.validation;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = CodeNameValidator.class)
@Target( { ElementType.METHOD, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface CodeNameConstraints {
    String message() default "name must consist only of a-z, 0-9, underscore";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

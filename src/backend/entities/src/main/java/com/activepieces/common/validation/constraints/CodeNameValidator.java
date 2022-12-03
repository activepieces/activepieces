package com.activepieces.common.validation.constraints;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class CodeNameValidator implements
        ConstraintValidator<CodeNameConstraints, String> {

    @Override
    public void initialize(CodeNameConstraints contactNumber) {
    }

    @Override
    public boolean isValid(String contactField,
      ConstraintValidatorContext cxt) {
        return contactField != null && contactField.matches("[a-z0-9_]*");
    }

}
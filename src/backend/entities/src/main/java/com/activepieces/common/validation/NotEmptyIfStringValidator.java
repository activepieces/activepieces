package com.activepieces.common.validation;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.Objects;

public class NotEmptyIfStringValidator implements
        ConstraintValidator<NotEmptyIfString, Object> {

    @Override
    public void initialize(NotEmptyIfString contactNumber) {
    }

    @Override
    public boolean isValid(Object contactField,
      ConstraintValidatorContext cxt) {
        if( Objects.isNull(contactField)){
            return true;
        }
        if(!contactField.getClass().equals(String.class)){
            return true;
        }
        return ((String) contactField).length() > 0;
    }

}

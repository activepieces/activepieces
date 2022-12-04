package com.activepieces.entity.subdocuments.field;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@SuperBuilder
@Getter
@AllArgsConstructor
public class EmptyField extends Variable {


    @Override
    public Object getValue() {
        return null;
    }

    @Override
    public boolean validate(Object finalValue) {
        return true;
    }

}

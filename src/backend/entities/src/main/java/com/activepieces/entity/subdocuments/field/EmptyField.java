package com.activepieces.entity.subdocuments.field;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@SuperBuilder
@Getter
@AllArgsConstructor
public class EmptyField extends Variable<Object> {


    @Override
    public Object getValue() {
        return null;
    }

    @Override
    public boolean validate(Object finalValue) {
        return true;
    }

    @Override
    public Object getSettings() {
        return null;
    }

    @Override
    public void setSettings(Object settings) {

    }
}

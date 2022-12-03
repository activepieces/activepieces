package com.activepieces.entity.subdocuments.field;

public interface ValueField {

     Object getValue();

     boolean validate(Object finalValue);
}

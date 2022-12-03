package com.activepieces.entity.subdocuments.field;

public interface VariableSettings<T> extends ValueField{

    T getSettings();

    void setSettings(T settings);
}

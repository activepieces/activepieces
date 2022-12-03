package com.activepieces.actions.store;


import com.activepieces.actions.store.model.StorePath;
import com.activepieces.actions.store.model.StoreValueView;
import com.activepieces.entity.enums.StoreScope;

import java.util.List;
import java.util.Optional;

public interface StorageService {

    StoreValueView put(StorePath storePath, Object value);

    Optional<StoreValueView> get(StorePath storePath);

}

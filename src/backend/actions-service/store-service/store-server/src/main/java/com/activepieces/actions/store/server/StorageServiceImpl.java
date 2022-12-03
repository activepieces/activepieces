package com.activepieces.actions.store.server;

import com.activepieces.actions.store.StorageService;
import com.activepieces.actions.store.model.StorePath;
import com.activepieces.actions.store.model.StoreValueView;
import com.activepieces.actions.store.server.mapper.StoreMapper;
import com.activepieces.actions.store.server.repository.StoreRepository;
import com.activepieces.common.utils.HashUtils;
import com.activepieces.entity.nosql.StoreValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class StorageServiceImpl implements StorageService {

  private final StoreMapper storeMapper;
  private final StoreRepository storeRepository;

  @Autowired
  public StorageServiceImpl(StoreRepository storeRepository, StoreMapper storeMapper) {
    this.storeRepository = storeRepository;
    this.storeMapper = storeMapper;
  }

  @Override
  public StoreValueView put(StorePath storePath, Object value) {
    final String path = buildPath(storePath.getPaths());
    String storeId = HashUtils.calculateHash(path);
    StoreValueView storeValueView =
        StoreValueView.builder()
            .value(value)
            .epochCreationTime(Instant.now().toEpochMilli())
            .epochUpdateTime(Instant.now().toEpochMilli())
            .key(path)
            .id(storeId)
            .build();
    return storeMapper.toView(storeRepository.save(storeMapper.fromView(storeValueView)));
  }

  @Override
  public Optional<StoreValueView> get(StorePath storePath) {
    final String path = buildPath(storePath.getPaths());
    Optional<StoreValue> storeValueOptional =
        storeRepository.findById(HashUtils.calculateHash(path));
    if (storeValueOptional.isEmpty()) {
      return Optional.empty();
    }
    return Optional.of(storeMapper.toView(storeValueOptional.get()));
  }

  private String buildPath(List<String> storePath){
    return String.join("/", storePath);
  }
}

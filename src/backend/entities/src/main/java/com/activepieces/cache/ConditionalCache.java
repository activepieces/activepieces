package com.activepieces.cache;

import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

public class ConditionalCache<K, V> {

  private final ConcurrentHashMap<K, V> cache = new ConcurrentHashMap();
  private final Function<K, V> generator;
  private final Function<V, Boolean> condition;

  public ConditionalCache(Function<K, V> generator, Function<V, Boolean> condition) {
    this.generator = generator;
    this.condition = condition;
  }

  public V get(K key) {
    if (cache.contains(key)) {
      return cache.get(key);
    }
    V value = generator.apply(key);
    if (this.condition.apply(value)) {
      cache.put(key, value);
    }
    return value;
  }
}

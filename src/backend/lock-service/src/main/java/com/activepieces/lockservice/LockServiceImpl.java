package com.activepieces.lockservice;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@Log4j2
public class LockServiceImpl implements LockService {

  @Autowired
  public LockServiceImpl() {

  }

  @Override
  public String acquire(String key, Duration expiration) {
    return null;
    /*    try {
      Query query = Query.query(Criteria.where("_id").is(key));
      String token = UUID.randomUUID().toString();
      Update update =
          new Update()
              .setOnInsert("_id", key)
              .setOnInsert(
                  "expireAt", Instant.now().getEpochSecond() * 1000 + expiration.toMillis())
              .setOnInsert("token", token);
      FindAndModifyOptions options = new FindAndModifyOptions().upsert(true).returnNew(true);
      LockDocument doc = mongoTemplate.findAndModify(query, update, options, LockDocument.class);
      boolean locked = doc.getToken() != null && doc.getToken().equals(token);
      // If expired

      if (!locked && doc.getExpireAt() < Instant.now().getEpochSecond() * 1000) {
        DeleteResult deleted =
            this.mongoTemplate.remove(
                Query.query(
                    Criteria.where("_id")
                        .is(key)
                        .and("token")
                        .is(doc.getToken())
                        .and("expireAt")
                        .is(doc.getExpireAt())),
                LockDocument.class);

        if (deleted.getDeletedCount() >= 1) {
          return this.acquire(key, expiration);
        }
      }
      log.debug("Tried to acquire lock for key {} with token {} . Locked: {}", key, token, locked);
      if(locked){
        log.info("Acquired lock for key {} with token {}.", key, token);
      }
      return locked ? token : null;
    } catch (MongoCommandException exception) {
      return null;
    }*/
  }

  @Override
  public String waitUntilAcquire(String key, Duration expiration, Duration timeout)
      throws CannotAcquireLockException {
    long retryInMs = 200;
    long startTime = Instant.now().getEpochSecond();
    while (Instant.now().getEpochSecond() - startTime <= timeout.getSeconds()) {
      String token = acquire(key, expiration);
      if (Objects.nonNull(token)) {
        return token;
      }
      try {
        Thread.sleep(retryInMs);
      } catch (InterruptedException e) {
        e.printStackTrace();
      }
    }
    throw new CannotAcquireLockException(key, timeout);
  }

  @Override
  public boolean release(String key, String token) {
    return false;
/*    Query query = Query.query(Criteria.where("_id").is(key).and("token").is(token));
    DeleteResult deleted = mongoTemplate.remove(query, LockDocument.class);
    boolean released = deleted.getDeletedCount() == 1;
    if (released) {
      log.info("Remove query successfully affected 1 record for key {} with token {}", key, token);
    } else if (deleted.getDeletedCount() > 0) {
      log.error(
          "Unexpected result from release for key {} with token {}, released {}",
          key,
          token,
          deleted);

    } else {

      log.error("Remove query did not affect any records for key {} with token {}", key, token);
    }
    return released;*/
  }



}

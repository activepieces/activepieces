package com.activepieces.lockservice;

import com.activepieces.entity.nosql.LockDocument;
import com.mongodb.MongoCommandException;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@Log4j2
public class LockNameServiceImpl implements LockNameService {

  @Override
  public String saveFlowLock(UUID flowId) {
    return String.format("SAVE_FLOW_%s", flowId.toString());
  }
}

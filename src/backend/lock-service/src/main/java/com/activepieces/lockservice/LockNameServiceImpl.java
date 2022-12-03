package com.activepieces.lockservice;

import com.github.ksuid.Ksuid;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Log4j2
public class LockNameServiceImpl implements LockNameService {

  @Override
  public String saveFlowLock(Ksuid flowId) {
    return String.format("SAVE_FLOW_%s", flowId.toString());
  }
}

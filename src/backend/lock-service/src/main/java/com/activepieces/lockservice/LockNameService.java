package com.activepieces.lockservice;

import java.util.UUID;

public interface LockNameService {

  String saveFlowLock(UUID flowId);

}

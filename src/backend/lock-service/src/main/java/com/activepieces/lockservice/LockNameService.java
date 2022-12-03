package com.activepieces.lockservice;

import com.github.ksuid.Ksuid;

import java.util.UUID;

public interface LockNameService {

  String saveFlowLock(Ksuid flowId);

}

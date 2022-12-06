package com.activepieces.lock;

import com.activepieces.common.error.exception.FailedToObtainLockException;
import org.springframework.integration.jdbc.lock.JdbcLockRegistry;
import org.springframework.integration.support.locks.LockRegistry;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;

@Service
public class JDBCLockService implements LockService{
    private final LockRegistry lockRegistry;

    public JDBCLockService(JdbcLockRegistry jdbcLockRegistry) {
        this.lockRegistry = jdbcLockRegistry;
    }

    @Override
    public Lock tryLock(String key, Duration timeout) throws FailedToObtainLockException {
        Lock lock = lockRegistry.obtain(key);
        try {
            if(!lock.tryLock(timeout.getSeconds(), TimeUnit.SECONDS)){
                throw new FailedToObtainLockException(new RuntimeException(String.format("Lock %s timed out after %s seconds", key, timeout.getSeconds())));
            }
        } catch (InterruptedException e) {
            throw new FailedToObtainLockException(e);
        }
        return lock;
    }
}
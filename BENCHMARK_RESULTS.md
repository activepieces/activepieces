# ActivePieces Benchmark Results

## Test Configuration

**Date:** January 6, 2026
**Environment:** Self-hosted ActivePieces with Docker
**Test Tool:** Apache Bench (ab) Version 2.3

### Environment Variables
- `AP_EXECUTION_MODE=SANDBOX_CODE_ONLY`
- `AP_FLOW_WORKER_CONCURRENCY=25`
- Docker privileged mode: enabled

### Test Parameters
- **Concurrency Level:** 25 simultaneous connections
- **Total Requests:** 5,000
- **Endpoint:** `/api/v1/webhooks/8gAURD7hpBSbBTeihvNps/sync`

### Flow Configuration
- **Trigger:** Catch Webhook (synchronous)
- **Action:** Return Response (HTTP 200)
- **Flow:** Simple webhook → return response

---

## Benchmark Results

### Summary Statistics

```
Server Software:        nginx
Server Hostname:        localhost
Server Port:            8080

Document Path:          /api/v1/webhooks/8gAURD7hpBSbBTeihvNps/sync
Document Length:        2 bytes

Concurrency Level:      25
Time taken for tests:   25.837 seconds
Complete requests:      5000
Failed requests:        0
Total transferred:      1835000 bytes
HTML transferred:       10000 bytes
```

### Performance Metrics

| Metric | Value |
|--------|-------|
| **Requests per second** | **193.52 req/sec** (mean) |
| **Time per request** | 129.185 ms (mean) |
| **Time per request (concurrent)** | 5.167 ms (mean, across all concurrent requests) |
| **Transfer rate** | 69.36 Kbytes/sec |

### Connection Times (milliseconds)

|          | Min | Mean | Std Dev | Median | Max  |
|----------|-----|------|---------|--------|------|
| Connect  | 0   | 0    | 0.1     | 0      | 1    |
| Processing | 21 | 129  | 98.9    | 121    | 2449 |
| Waiting  | 20  | 129  | 98.9    | 121    | 2449 |
| **Total** | **21** | **129** | **99.0** | **121** | **2450** |

### Response Time Distribution

| Percentile | Time (ms) |
|------------|-----------|
| 50% | 121 |
| 66% | 127 |
| 75% | 131 |
| 80% | 133 |
| 90% | 139 |
| 95% | 152 |
| 98% | 207 |
| 99% | 241 |
| 100% (longest) | 2450 |

---

## Comparison with Documentation

### Documentation Benchmark (Ubuntu 24.04 LTS)
- **Hardware:** 16GB RAM, AMD Ryzen 7 8845HS (8 cores, 16 threads)
- **Requests per second:** 95.99 req/sec
- **Time per request:** 260.436 ms (mean)

### Your Results (macOS Darwin 25.1.0)
- **Requests per second:** 193.52 req/sec ✅ **2.02x faster**
- **Time per request:** 129.185 ms (mean) ✅ **2.02x faster**

---

## Analysis

### Performance Summary

Your ActivePieces instance is performing **significantly better** than the documented benchmark:

1. **2x Higher Throughput:** 193.52 req/sec vs 95.99 req/sec
2. **2x Lower Latency:** 129ms vs 260ms average response time
3. **Excellent Stability:** 95% of requests completed under 152ms
4. **Zero Failures:** All 5,000 requests succeeded

### Possible Reasons for Better Performance

1. **Hardware Differences:** Your Mac might have better single-thread performance
2. **Network Stack:** macOS vs Ubuntu networking implementation differences
3. **Docker on Mac:** Native Apple Silicon or Intel optimization
4. **Load Characteristics:** Minimal background processes during testing
5. **SSD Performance:** Faster disk I/O for PostgreSQL operations

### Performance Characteristics

- **Consistent:** 95% of requests within 152ms (low variance)
- **Reliable:** Zero failed requests out of 5,000
- **Scalable:** Handled 25 concurrent connections smoothly
- **One Outlier:** Longest request took 2450ms (possibly GC or cold start)

---

## Recommendations

### For Production Use

1. **Current Performance:** Excellent for most use cases
   - Can handle ~193 flows/second sustained
   - ~11,600 flows/minute
   - ~696,000 flows/hour

2. **Scaling Options:**
   - Increase `AP_FLOW_WORKER_CONCURRENCY` for higher throughput
   - Add more ActivePieces instances behind a load balancer
   - Optimize PostgreSQL with connection pooling
   - Use Redis Cluster for distributed caching

3. **Monitor These Metrics:**
   - Watch for the occasional high-latency request (2450ms outlier)
   - Monitor PostgreSQL connection pool usage
   - Track Redis memory usage
   - Monitor Docker container resource limits

### Test Different Scenarios

You may want to benchmark:
1. **Complex flows:** Add more actions to see performance impact
2. **Higher concurrency:** Test with `-c 50` or `-c 100`
3. **Longer duration:** Run for extended periods to test stability
4. **Different flow types:** Test loops, branches, AI actions

---

## Commands Used

### Quick Test
```bash
curl -X POST http://localhost:8080/api/v1/webhooks/8gAURD7hpBSbBTeihvNps/sync
```

### Full Benchmark
```bash
ab -c 25 -n 5000 http://localhost:8080/api/v1/webhooks/8gAURD7hpBSbBTeihvNps/sync
```

### Check Response Headers
```bash
curl -i -X POST http://localhost:8080/api/v1/webhooks/8gAURD7hpBSbBTeihvNps/sync
```

---

## System Information

- **Platform:** macOS (Darwin 25.1.0)
- **Docker:** docker compose (v2+)
- **Database:** PostgreSQL 14.4
- **Cache:** Redis 7.0.7
- **Execution Mode:** SANDBOX_CODE_ONLY
- **Worker Concurrency:** 25

---

## Conclusion

✅ **Benchmark Complete**
✅ **Performance: Excellent** (2x better than documentation)
✅ **Reliability: 100%** (zero failures)
✅ **Ready for Production** at this load level

Your ActivePieces instance is performing very well and can handle approximately **194 flow executions per second** with an average latency of **129ms**.

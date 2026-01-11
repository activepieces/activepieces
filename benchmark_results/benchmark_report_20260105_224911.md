# ActivePieces Benchmark Report

## Test Information

- **Date:** Mon Jan  5 22:49:42 EST 2026
- **Webhook URL:** http://localhost:8080/api/v1/webhooks/8gAURD7hpBSbBTeihvNps/sync
- **Concurrency Level:** 25
- **Total Requests:** 5000

---

## Apache Bench Results

```
This is ApacheBench, Version 2.3 <$Revision: 1913912 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient)
Completed 500 requests
Completed 1000 requests
Completed 1500 requests
Completed 2000 requests
Completed 2500 requests
Completed 3000 requests
Completed 3500 requests
Completed 4000 requests
Completed 4500 requests
Completed 5000 requests
Finished 5000 requests


Server Software:        nginx
Server Hostname:        localhost
Server Port:            8080

Document Path:          /api/v1/webhooks/8gAURD7hpBSbBTeihvNps/sync
Document Length:        2 bytes

Concurrency Level:      25
Time taken for tests:   24.162 seconds
Complete requests:      5000
Failed requests:        0
Total transferred:      1835000 bytes
HTML transferred:       10000 bytes
Requests per second:    206.94 [#/sec] (mean)
Time per request:       120.808 [ms] (mean)
Time per request:       4.832 [ms] (mean, across all concurrent requests)
Transfer rate:          74.17 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.1      0       4
Processing:    15  120  16.0    120     214
Waiting:       15  120  16.0    120     214
Total:         15  121  16.0    120     215

Percentage of the requests served within a certain time (ms)
  50%    120
  66%    126
  75%    129
  80%    132
  90%    139
  95%    148
  98%    161
  99%    168
 100%    215 (longest request)
```

---

## Resource Usage Summary

```

redis:
  CPU: avg=12.66%, min=0.19%, max=16.75%
  Memory: avg=0.09%, min=0.09%, max=0.10%

postgres:
  CPU: avg=27.12%, min=0.36%, max=37.47%
  Memory: avg=1.63%, min=1.55%, max=1.70%

activepieces:
  CPU: avg=181.95%, min=2.98%, max=254.17%
  Memory: avg=30.74%, min=17.23%, max=42.60%
```

---

## Performance Metrics

Failed requests:        0
Requests per second:    206.94 [#/sec] (mean)
Time per request:       120.808 [ms] (mean)
Time per request:       4.832 [ms] (mean, across all concurrent requests)

---

## Files Generated

- Raw Apache Bench output: `ab_results_20260105_224911.txt`
- Resource usage CSV: `resources_20260105_224911.csv`
- Resource summary: `resource_summary_20260105_224911.txt`
- This report: `benchmark_report_20260105_224911.md`

---

## Next Steps

1. Review the resource usage to identify bottlenecks
2. Compare with previous benchmark runs
3. Adjust `AP_FLOW_WORKER_CONCURRENCY` if needed
4. Consider scaling strategies based on CPU/Memory usage


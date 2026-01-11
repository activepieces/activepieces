# ActivePieces Benchmark Setup Guide

## Configuration Complete ✅

The following environment variables have been configured in `.env`:
- `AP_EXECUTION_MODE=SANDBOX_CODE_ONLY` - Optimized execution mode
- `AP_FLOW_WORKER_CONCURRENCY=25` - Handles 25 concurrent flow executions
- Docker privileged mode enabled in `docker-compose.yml`

## Next Steps: Create Benchmark Flow

### 1. Create a Simple Webhook Flow

1. Open ActivePieces in your browser: http://localhost:8080
2. Log in to your account
3. Create a new flow:
   - Click "Create Flow" or "New Flow"
   - Name it something like "Benchmark Test Flow"

4. Add a **Webhook Trigger**:
   - Click on the trigger step
   - Select "Webhooks" from the pieces
   - Choose "Catch Webhook" trigger
   - Save the trigger
   - **IMPORTANT:** Copy the webhook URL that appears - it will look like:
     `http://localhost:8080/api/v1/webhooks/GMtpNwDsy4mbJe3369yzy`

5. Add a **Return Response Action**:
   - Click the "+" button after the webhook trigger
   - Search for "Webhook"
   - Select "Return Response" action
   - Configure:
     - Status Code: `200`
     - Body: `{"status": "ok"}` (or any simple JSON)
   - Save the action

6. **Publish the flow**:
   - Click the "Publish" button in the top right
   - Make sure the flow is enabled

### 2. Get Your Webhook URL

Your webhook URL should look like:
```
http://localhost:8080/api/v1/webhooks/YOUR_WEBHOOK_ID
```

**For synchronous testing**, append `/sync` to the URL:
```
http://localhost:8080/api/v1/webhooks/YOUR_WEBHOOK_ID/sync
```

### 3. Run the Benchmark Test

Once you have your webhook URL, run:

```bash
# Replace YOUR_WEBHOOK_ID with your actual webhook ID
ab -c 25 -n 5000 http://localhost:8080/api/v1/webhooks/YOUR_WEBHOOK_ID/sync
```

Parameters explained:
- `-c 25` = Concurrency level (25 simultaneous requests)
- `-n 5000` = Total number of requests to perform
- The URL should end with `/sync` for synchronous execution

### 4. Expected Results

Based on the documentation, you should see results similar to:

```
Requests per second:    95.99 [#/sec] (mean)
Time per request:       260.436 [ms] (mean)
```

### 5. Quick Test First

Before running the full benchmark, test your webhook:

```bash
# Replace YOUR_WEBHOOK_ID with your actual webhook ID
curl -X POST http://localhost:8080/api/v1/webhooks/YOUR_WEBHOOK_ID/sync
```

You should get a 200 response with your configured body.

## Troubleshooting

If you get errors:
1. Check containers are running: `docker compose ps`
2. Check ActivePieces logs: `docker compose logs activepieces`
3. Verify the flow is published and enabled in the UI
4. Make sure the webhook URL is correct and ends with `/sync`

## System Information

Your Mac specs:
- macOS: Darwin 25.1.0
- This may have different performance characteristics than the Ubuntu system in the docs

The documented results were from:
- 16GB RAM
- AMD Ryzen 7 8845HS (8 cores, 16 threads)
- Ubuntu 24.04 LTS

Your results may vary based on your hardware.

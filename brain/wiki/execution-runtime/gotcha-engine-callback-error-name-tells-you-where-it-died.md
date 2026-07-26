---
icon: 🔌
---

# Gotcha: the engine callback's error *name* tells you where it died

When a run fails with `ProgressUpdateError` vs `EngineRunCallbackError`, the name is a precise diagnostic — don't read either as "the callback POST failed".

`engineRunApi.post()` throws `EngineRunCallbackError` (an `EngineGenericError`, so type ENGINE) for a non-ok HTTP response. `utils.tryCatchAndThrowOnEngineError` rethrows ENGINE errors untouched. So:

- **`EngineRunCallbackError`** → the app answered with an error status. Real HTTP failure.
- **`ProgressUpdateError`** → the underlying error was *not* an `ExecutionError` at all. `tryCatchAndThrowOnEngineError` passed it through and `flow-run-progress-reporter` wrapped it. **This can never be an HTTP error status.**

Second discriminator, **timing**: `PROGRESS_RETRY_CONFIG` is `retries: 3, retryDelay: 3000`, and `fetch-retry` *does* retry network-level rejections when `retryOn` is an array (only the `.catch` → `attempt < retries` branch; easy to misread as status-only). So any genuine network failure burns **≥9s** before surfacing. A `ProgressUpdateError` on a job that finished in 3s never touched the network.

Together those pin the failure to a synchronous throw inside `post()` before any fetch — in practice `JSON.stringify(body)`, which is evaluated eagerly while building the fetch `init` and therefore sits *outside* the retry wrapper entirely.

**Why this bit us (July 2026):** 19 failed jobs reading only `ProgressUpdateError: {"message": "Failed to send updateRunProgress"}`. All 19 — sampled across 3 flows, 2 projects, both TESTING and PRODUCTION — were the *same* cause: **`TypeError: Converting circular structure to JSON`**.

**The cycle, which is an engine bug, not bad user data.** Referencing a loop step's output from a step *inside* that loop (`{{step_2['output']}}`) is legitimate — `LoopStepOutput.output` is `{ item, index, iterations }`, so `data.item…` works. But the engine aliases it live rather than snapshotting:

- `executionJournal.upsertStep` walks to `loopOutput.output.iterations[i]` and does `target[stepName] = stepOutput` — **in-place mutation**, returning the same `steps` object.
- `LoopStepOutput.setItemAndIndex` forwards **the same array** (`iterations: this.output?.iterations ?? []`).

So the nested step's resolved `input` holds a live reference to the loop output, and the moment `upsertStep` records that step into `iterations[i]`, you get `step_3.input.data.iterations[0].step_3 === step_3`. It throws on the step's **RUNNING** update, before the step body executes.

Note this is exactly the mutation-across-a-function-boundary that the root `CLAUDE.md` forbids. A true fix means making the journal immutable — but beware: `loop-executor.ts` *depends* on the in-place write. It keeps `stepOutput` as a local across iterations and `addIteration()` spreads `this.output.iterations`, which only holds nested results because they were mutated into the shared array. Go immutable without re-reading via `getLoopStepOutput()` each iteration and every nested step's output silently vanishes.

Contained (not cured) by typing the serialization failure as a USER `CallbackSerializationError` so the run FAILS cleanly, plus guarding the trailing `sendUpdate`/`backup` in `flow.operation.ts`, which sat outside every `tryCatch`. Do **not** make progress updates best-effort instead: the same graph fails again at `backup()`, so you'd run every loop iteration's side effects (outbound HTTP, webhooks) and still fail — then repeat on each retry.

**Where the real cause actually lives.** `formatMessage` serializes only `{ message }`, so the cause never reaches `failedReason`, and the engine's stderr goes into the BullMQ job rather than ClickHouse. But it is **not** lost: the run log's `internalError.raw` holds the full Node inspection *including* the `cause:` block with the original `TypeError` and its stack.

To read it, fetch `files.logFile.s3Key` and decompress. `debug-failed-job.js` cannot — the DevOps box is on Node 20 and the log is ZSTD (needs ≥22.15), which is why the script reports `runLogs: null` with a note. Pull the bytes down and decompress on a modern Node instead:

```bash
# on the box: base64 the S3 object to stdout (reuses /root/queue's dotenv + aws-sdk)
ssh <host> 'cd /root/queue && node -' < fetch.js "<s3Key>" > log.b64
# locally, Node >= 22.15:
node -e "const z=require('zlib'),f=require('fs');
console.log(z.zstdDecompressSync(Buffer.from(f.readFileSync('log.b64','utf8'),'base64')).toString())"
```

**Do this first.** The two discriminators above narrow it, but the log gives you the exact error and stack in a couple of minutes.

**`isTestFlow` does not mean "TESTING run".** The per-step gate is `if (!stepNameToUpdate || !engineConstants.isTestFlow) return`, and `isTestFlow` is defined as `streamStepProgress === StreamStepProgress.WEBSOCKET` — nothing to do with `RunEnvironment`. PRODUCTION runs stream too, so they take the same path. Don't conclude from an `updateRunProgress` failure that the run was a builder test; 6 of the 19 above were PRODUCTION.

Also note `sendUpdateProgress` and `sendLogsUpdate` both throw under the name `ProgressUpdateError` — only the inner text (`Failed to send updateRunProgress` vs `uploadRunLog`) tells you which call site died.

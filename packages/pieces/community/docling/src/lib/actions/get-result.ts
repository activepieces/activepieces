import { createAction, Property } from "@activepieces/pieces-framework";
import { doclingAuth, authFromCtx } from "../auth.js";
import { DoclingError } from "../errors.js";
import { pollTask, fetchResult, type TaskStatusResponse } from "../client.js";
import { getResultOutputFields } from "../output-schemas.js";

export const getResultAction = createAction({
  auth: doclingAuth,
  name: "get_result",
  displayName: "Get Result",
  description:
    "Checks an async conversion job (submitted by “Submit Job”). Returns the converted document when finished, or the current job status otherwise.",
  audience: "both",
  aiMetadata: {
    description:
      "Polls a docling-serve job by task id. Idempotent; safe to re-run (e.g. via a workflow retry) until the job finishes.",
    idempotent: true,
  },
  outputSchema: { fields: getResultOutputFields },
  props: {
    task_id: Property.ShortText({ displayName: "Task ID", required: true, description: "The task_id returned by “Submit Job”." }),
    wait_seconds: Property.Number({ displayName: "Wait (seconds)", required: false, defaultValue: 0, description: "Long-poll wait on the server, 0–30." }),
  },
  run: async (ctx) => {
    const p = ctx.propsValue as { task_id?: unknown; wait_seconds?: unknown };
    if (typeof p.task_id !== "string" || p.task_id.trim() === "") {
      throw new DoclingError("VALIDATION", "task_id is required.");
    }
    const wait = p.wait_seconds === undefined ? 0 : Number(p.wait_seconds);
    if (!Number.isInteger(wait) || wait < 0 || wait > 30) {
      throw new DoclingError("VALIDATION", `wait_seconds must be an integer between 0 and 30, got ${String(p.wait_seconds)}.`);
    }
    const auth = authFromCtx(ctx);
    const status: TaskStatusResponse = await pollTask(auth, p.task_id.trim(), wait);
    if (status.task_status === "failure") {
      const f = status.failure;
      throw new DoclingError("JOB_FAILED", `docling job failed [${f?.category ?? "unknown"}]: ${f?.message ?? status.error_message ?? "unknown"}`, f?.retryable ?? false);
    }
    if (status.task_status === "success" || status.task_status === "partial_success" || status.task_status === "skipped") {
      const result = await fetchResult(auth, status.task_id);
      if ("failure" in result && !("document" in result) && !("chunks" in result)) {
        throw new DoclingError("JOB_FAILED", `docling job failed: ${result.failure.message ?? "unknown"}`, result.failure.retryable ?? false);
      }
      return { done: true, task_id: status.task_id, ...(result as Record<string, unknown>) };
    }
    return {
      done: false,
      task_id: status.task_id,
      task_status: status.task_status,
      task_position: status.task_position ?? null,
      task_meta: status.task_meta ?? null,
    };
  },
});

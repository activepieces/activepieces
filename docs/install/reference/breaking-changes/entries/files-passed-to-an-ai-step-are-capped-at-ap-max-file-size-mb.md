---
id: files-passed-to-an-ai-step-are-capped-at-ap-max-file-size-mb
title: "Files passed to an AI step are capped at `AP_MAX_FILE_SIZE_MB`"
added: '2026-09-16'
release: 0.92.0
---

Extract Structured Data and Generate Image used to read file inputs straight from the flow's memory, so no Activepieces-side size limit applied. Those files are now stored and fetched by the worker that runs the model, which puts them under the same per-file limit as every other file the engine writes: `AP_MAX_FILE_SIZE_MB`, 25 MB by default.

The limit is per file, not per step, so several large files in one step are fine as long as each is under it. On Activepieces Cloud the limit is 10 MB and is not configurable.

#### What you need to do

Nothing unless an AI step handles files larger than 25 MB. Those steps now fail with a size error naming the limit. Raise `AP_MAX_FILE_SIZE_MB` on a self-hosted installation if you need more.

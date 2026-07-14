# Data & Storage

The structured-data and blob-storage primitives a project owns: Tables and their rows/columns, stored Files, and key-value state.

## Language

**Table**:
A built-in structured data store within a project, with fields, records, and automation triggers.
_Avoid_: database, spreadsheet

**Field**:
A column definition in a Table with a name and type (TEXT, NUMBER, DATE, STATIC_DROPDOWN).
_Avoid_: column

**Record**:
A single row in a Table, composed of Cells keyed by Field.
_Avoid_: row, entry

**Cell**:
A single value at the intersection of a Record and a Field in a Table.

**TableWebhook**:
A registration linking table events (record created/updated/deleted) to a flow for automation.
_Avoid_: table trigger

**File**:
A stored blob (S3 or DB) with type classification, optional compression, and expiry.
_Avoid_: attachment, blob

**Streamed write**:
A `context.files.write` call that uploads a Node `Readable` plus its known byte `size`, instead of a fully-buffered `Buffer`. On the S3 signed-URL transport the bytes flow engine→S3 without materializing the whole file; on any other transport it falls back to buffering (bounded by `MAX_FILE_SIZE_MB`). Applies to `FLOW_STEP_FILE` only.
_Avoid_: streamable data, streaming upload

**Store Entry**:
A key-value pair scoped to a project, used by pieces to persist state across flow runs.
_Avoid_: kv store, project store

**Knowledge Base**:
A document store for AI agents that chunks files into vector-embedded segments for semantic search.
_Avoid_: RAG store, document index

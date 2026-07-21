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

**ApStreamingFile**:
The resolved value of a `Property.File({ streaming: true })` input — `{ filename, extension?, size?, body: Readable }`. A one-shot lazy file the engine exposes without buffering, so a piece can upload a large file to an external service. Contrast **ApFile**, the buffered (`Buffer` + `base64`) value of a plain `Property.File()`.
_Avoid_: file stream, streamed file

**Store Entry**:
A key-value pair scoped to a project, used by pieces to persist state across flow runs.
_Avoid_: kv store, project store

**Knowledge Base**:
A document store for AI agents that chunks files into vector-embedded segments for semantic search.
_Avoid_: RAG store, document index

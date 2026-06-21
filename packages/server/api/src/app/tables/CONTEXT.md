# Tables & Storage

The built-in structured data store (tables, fields, records) and the blob/file storage that backs sample data, logs, and attachments.

## Language

**Table**:
A built-in structured data store within a project, with fields, records, and automation triggers.
_Avoid_: database, spreadsheet

**Field**:
A column definition in a `Table` with a name and type (TEXT, NUMBER, DATE, STATIC_DROPDOWN).
_Avoid_: column

**Record**:
A single row in a `Table`, composed of cells keyed by field.
_Avoid_: row, entry

**Cell**:
A single value at the intersection of a `Record` and a `Field` in a `Table`.

**TableWebhook**:
A registration linking table events (record created/updated/deleted) to a flow for automation.
_Avoid_: table trigger

**Store Entry**:
A key-value pair scoped to a project, used by pieces to persist state across flow runs.
_Avoid_: kv store, project store

**File**:
A stored blob (S3 or DB) with type classification, optional compression, and expiry.
_Avoid_: attachment, blob

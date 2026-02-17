---
name: generate-flow
description: Generate valid ActivePieces flow JSON from a natural language description. Use when asked to generate a flow, create a flow from prompt, generate flow JSON, or build a flow template.
argument-hint: [description] [--format api|template] [--scaffold]
---

# /generate-flow

Generate valid ActivePieces flow JSON from a natural language description.

## Arguments

- `--format api|template` — Output format (default: `template`)
  - `template`: `Template` JSON with `{ name, template: FlowVersionTemplate }` (for UI import via "Import Flow" dialog)
  - `api`: `ImportFlowRequest` JSON (for `POST /v1/flows/:id/operations` with `IMPORT_FLOW` type)
- `--scaffold` — Generate structure with placeholder inputs instead of fully configured values. Placeholders are marked with `"TODO: ..."` strings.
- The rest of the arguments form the natural language description of the desired flow.

## Instructions

### 1. Understand the Request

Parse the user's natural language description to identify:
- **Trigger**: What event starts the flow (e.g., "when a Slack message arrives", "every day at 9am", "when a webhook is received")
- **Actions**: What steps the flow performs, in order
- **Branching**: Any conditional logic (if/else, router)
- **Loops**: Any iteration over lists
- **Pieces**: Which integrations are needed (Slack, Google Sheets, Notion, etc.)

### 2. Search the Flow Library for Examples

Search the alan-automation flow library at `../alan-automation/` for relevant examples:

1. **Search descriptions** for relevant keywords (piece names, action types, patterns):
   ```
   Grep pattern="<keyword>" path="../alan-automation/projects/" glob="**/metadata/*/description.md"
   ```
2. **Read 2-4 of the most relevant description.md files** to understand similar flows
3. **Read the corresponding flow JSON files** at `../alan-automation/projects/<project>/flows/<id>.json` as few-shot examples. The `<id>` is the directory name from the metadata path.

### 3. Load References

Read these reference files for exact schema and piece information:
- `references/flow-schema.md` — Complete JSON schema for all flow types
- `references/piece-catalog.md` — Available pieces, triggers, actions, and input shapes

Also load 2-3 relevant example files from `examples/` that match the pattern needed (linear, router, loop, code).

### 4. Generate the Flow JSON

Build the flow JSON following these rules:

#### Step Naming
- The trigger is always named `"trigger"`
- Actions are named sequentially: `"step_1"`, `"step_2"`, `"step_3"`, etc.
- Step names must be unique across the entire flow

#### Connection References
- Use placeholder connection names: `{{connections['<piece-name>']}}`
- Example: `{{connections['slack']}}`, `{{connections['google-sheets']}}`
- The user will map these to real connections after import

#### Expression Syntax
- Reference trigger output: `{{trigger['field_name']}}`
- Reference step output: `{{step_1['field_name']}}` or `{{step_1.field_name}}`
- Reference loop item: `{{step_N['item']['field_name']}}` (where step_N is the loop step)
- Connection auth: `{{connections['connection-name']}}`

#### Schema Version
- Always use `"16"` (the current `LATEST_FLOW_SCHEMA_VERSION`)

#### Property Settings
- For each property in `input`, include a corresponding entry in `propertySettings`
- Use `{"type": "MANUAL"}` for static values
- Use `{"type": "DYNAMIC"}` for values that depend on other selections (e.g., channel depends on auth)

#### Piece Versions
- Read the actual current version from each piece's `package.json` at `packages/pieces/community/<piece-name>/package.json` — the piece catalog may be outdated
- Use tilde prefix: `"~X.Y.Z"`
- If the piece directory is not found, use `"~0.0.1"` as a placeholder

#### Error Handling
- Include `errorHandlingOptions` on piece actions and code actions:
  ```json
  "errorHandlingOptions": {
    "retryOnFailure": { "value": false },
    "continueOnFailure": { "value": false }
  }
  ```

#### Router Branches
- Always include a `"FALLBACK"` branch as the last branch (usually named "Otherwise")
- The `children` array must match the `branches` array in length
- Use `null` in `children` for branches with no actions

#### Template Format
When `--format template` (default), wrap the flow in the `Template` structure that the UI import dialog accepts. The parser (`template-parser.ts`) supports two shapes:

1. **`{ name, template }`** (preferred):
```json
{
  "name": "Flow Name",
  "template": {
    "displayName": "Flow Name",
    "schemaVersion": "16",
    "valid": true,
    "trigger": { /* FlowTrigger */ },
    "notes": []
  }
}
```

2. **`{ name, flows }`**:
```json
{
  "name": "Flow Name",
  "flows": [{
    "displayName": "Flow Name",
    "schemaVersion": "16",
    "valid": true,
    "trigger": { /* FlowTrigger */ },
    "notes": []
  }]
}
```

The inner object is a `FlowVersionTemplate` — a `FlowVersion` without `id`, `created`, `updated`, `flowId`, `state`, `updatedBy`, `agentIds`, `connectionIds`, `backupFiles`. The `name` field at the top level is required by the parser.

**Important**: Do NOT use the `PopulatedFlow` format (with top-level `id`, `projectId`, `version` wrapper) — the UI import dialog does not recognize it.

#### API Format (ImportFlowRequest)
When `--format api`, output only:
```json
{
  "displayName": "Flow Name",
  "trigger": { ... },
  "schemaVersion": "16",
  "notes": []
}
```

#### Note Positioning
- Notes are placed at absolute canvas coordinates — they must align with the step they annotate
- Calculate each step's Y position using the layout rules in `references/flow-schema.md` § "Canvas Layout & Note Positioning"
- Quick reference: trigger at y=0, each linear step adds 120, router children offset by +210, loop children offset by +180
- Place notes to the left of a step at `x ≈ -400`, to the right at `x ≈ 300`

### 5. Write the Output

Write the generated JSON to `./generated-flows/<flow-name>.json` where `<flow-name>` is a kebab-case version of the flow's display name.

### 6. Validate

Before writing, verify:
- All step names are unique
- All expression references point to valid step names that come before the referencing step
- All piece names match entries in the piece catalog (`@activepieces/piece-<name>`)
- All action/trigger names match the piece catalog
- Router `children` array length matches `branches` array length
- Every `CONDITION` branch has non-empty `conditions`
- The flow is valid JSON

### 7. Report

After writing, report:
- Output file path
- Flow summary (trigger + action count)
- Pieces used
- Any placeholders that need to be filled (connections, IDs, etc.)
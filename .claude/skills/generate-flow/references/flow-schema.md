# ActivePieces Flow JSON Schema Reference

Source: `packages/shared/src/lib/flows/`

## Schema Version

```
LATEST_FLOW_SCHEMA_VERSION = "16"
```

---

## Output Formats

### Template Format (UI Import)

The format accepted by the UI "Import Flow" dialog. Parsed by `template-parser.ts`.
Two equivalent shapes are supported:

**Shape 1: `{ name, template }` (preferred)**
```jsonc
{
  "name": "<string>",                      // Required — flow name shown in import dialog
  "template": { /* FlowVersionTemplate */ }
}
```

**Shape 2: `{ name, flows }` (multi-flow)**
```jsonc
{
  "name": "<string>",
  "flows": [                               // Array of FlowVersionTemplate
    { /* FlowVersionTemplate */ }
  ]
}
```

#### FlowVersionTemplate

A `FlowVersion` without DB-specific fields (`id`, `created`, `updated`, `flowId`, `state`, `updatedBy`, `agentIds`, `connectionIds`, `backupFiles`):

```jsonc
{
  "displayName": "<string>",
  "schemaVersion": "16",
  "valid": true,
  "trigger": { /* FlowTrigger */ },
  "notes": []                              // Optional array of Note objects
}
```

**Important**: Do NOT use the `PopulatedFlow` format (with top-level `id`, `projectId`, `version` wrapper) — the UI import dialog does not recognize it.

### PopulatedFlow (Database Format)

The full flow object as stored in the repo/database. Used in `examples/` as reference but NOT importable via the UI dialog.

```jsonc
{
  "id": "<ApId>",                          // 21-char alphanumeric string
  "created": "<ISO timestamp>",
  "updated": "<ISO timestamp>",
  "projectId": "<ApId>",
  "folderId": "<ApId> | null",
  "status": "ENABLED" | "DISABLED",
  "externalId": "<string> | null",
  "publishedVersionId": "<ApId> | null",
  "metadata": null,
  "operationStatus": "NONE",              // NONE | DELETING | ENABLING | DISABLING
  "timeSavedPerRun": null,
  "ownerId": "<ApId> | null",
  "templateId": null,
  "version": {
    "id": "<ApId>",
    "created": "<ISO timestamp>",
    "updated": "<ISO timestamp>",
    "flowId": "<ApId>",                   // Must match top-level id
    "displayName": "<string>",
    "schemaVersion": "16",
    "trigger": { /* FlowTrigger */ },
    "connectionIds": ["<string>", ...],   // Connection IDs referenced in the flow
    "agentIds": [],
    "updatedBy": "<ApId> | null",
    "valid": true,
    "state": "DRAFT" | "LOCKED",
    "backupFiles": null,
    "notes": []                           // Array of Note objects
  }
}
```

### ImportFlowRequest (API Format)

Minimal format for importing via `POST /v1/flows/:id` with `IMPORT_FLOW` operation:

```jsonc
{
  "displayName": "<string>",
  "trigger": { /* FlowTrigger */ },
  "schemaVersion": "16",
  "notes": []                             // Array of Note objects, or null
}
```

---

## Triggers

### FlowTrigger (Union)

```typescript
FlowTrigger = PieceTrigger | EmptyTrigger
```

### EmptyTrigger

Used as placeholder before a trigger is configured:

```jsonc
{
  "name": "trigger",
  "type": "EMPTY",
  "displayName": "Empty Trigger",
  "valid": false,
  "settings": {},
  "nextAction": { /* FlowAction (optional) */ }
}
```

### PieceTrigger

```jsonc
{
  "name": "trigger",
  "type": "PIECE_TRIGGER",
  "displayName": "<string>",
  "valid": true,
  "settings": {
    "pieceName": "@activepieces/piece-<name>",
    "pieceVersion": "<version>",           // e.g., "~0.7.13", "0.10.19"
    "triggerName": "<string>",             // e.g., "new-message-in-channel"
    "input": {                             // Property values
      "auth": "{{connections['<name>']}}",
      "<prop>": "<value or expression>",
      // ...
    },
    "propertySettings": {                  // One entry per property in input
      "auth": { "type": "MANUAL" },
      "<prop>": { "type": "MANUAL" | "DYNAMIC" }
    },
    "sampleData": {                        // Optional, omit for generated flows
      "lastTestDate": "<ISO timestamp>",
      "sampleDataFileId": "<string>"
    }
  },
  "nextAction": { /* FlowAction (optional) */ }
}
```

---

## Actions

### FlowAction (Recursive Union)

```typescript
FlowAction = CodeAction | PieceAction | LoopOnItemsAction | RouterAction
```

All actions share these common fields:

```jsonc
{
  "name": "<string>",                      // "step_1", "step_2", etc.
  "type": "<FlowActionType>",
  "displayName": "<string>",
  "valid": true,
  "skip": false,                           // Optional, defaults to false
  "nextAction": { /* FlowAction (optional) */ }
}
```

### PieceAction

```jsonc
{
  "name": "step_1",
  "type": "PIECE",
  "displayName": "<string>",
  "valid": true,
  "skip": false,
  "settings": {
    "pieceName": "@activepieces/piece-<name>",
    "pieceVersion": "<version>",
    "actionName": "<string>",              // e.g., "send_channel_message"
    "input": {
      "auth": "{{connections['<name>']}}",
      "<prop>": "<value or expression>"
    },
    "propertySettings": {
      "auth": { "type": "MANUAL" },
      "<prop>": { "type": "MANUAL" | "DYNAMIC" }
    },
    "errorHandlingOptions": {
      "retryOnFailure": { "value": false },
      "continueOnFailure": { "value": false }
    },
    "sampleData": {}                       // Optional
  },
  "nextAction": { /* FlowAction (optional) */ }
}
```

### CodeAction

```jsonc
{
  "name": "step_2",
  "type": "CODE",
  "displayName": "<string>",
  "valid": true,
  "skip": false,
  "settings": {
    "sourceCode": {
      "code": "<JavaScript/TypeScript code string>",
      "packageJson": "{}"                  // JSON string with npm dependencies
    },
    "input": {                             // Variables passed to code as `inputs`
      "<key>": "<value or expression>"
    },
    "errorHandlingOptions": {
      "retryOnFailure": { "value": false },
      "continueOnFailure": { "value": false }
    },
    "sampleData": {}
  },
  "nextAction": { /* FlowAction (optional) */ }
}
```

Code step signature:
```typescript
export const code = async (inputs: Record<string, unknown>) => {
  // Access inputs via inputs.<key>
  return <result>;
};
```

### LoopOnItemsAction

```jsonc
{
  "name": "step_3",
  "type": "LOOP_ON_ITEMS",
  "displayName": "Loop on Items",
  "valid": true,
  "skip": false,
  "settings": {
    "items": "{{step_1}}"                  // Expression resolving to an array
  },
  "firstLoopAction": { /* FlowAction (optional) — first step inside the loop */ },
  "nextAction": { /* FlowAction (optional) — step after the loop completes */ }
}
```

Inside a loop, reference the current item:
- `{{step_3['item']}}` — the current item
- `{{step_3['item']['field']}}` — a field on the current item
- `{{step_3['index']}}` — the current index (0-based)

### RouterAction

```jsonc
{
  "name": "step_4",
  "type": "ROUTER",
  "displayName": "Router",
  "valid": true,
  "skip": false,
  "settings": {
    "branches": [
      {
        "branchType": "CONDITION",
        "branchName": "<string>",
        "conditions": [                    // OR between groups, AND within groups
          [                                // Condition group (AND)
            {
              "operator": "<BranchOperator>",
              "firstValue": "<value or expression>",
              "secondValue": "<value or expression>",  // Not needed for single-value operators
              "caseSensitive": false                    // Only for text operators
            }
          ]
        ]
      },
      {
        "branchType": "FALLBACK",
        "branchName": "Otherwise"
      }
    ],
    "executionType": "EXECUTE_FIRST_MATCH" | "EXECUTE_ALL_MATCH"
  },
  "children": [
    { /* FlowAction — first action of branch 0 */ },
    null                                    // null = no actions in this branch
  ],
  "nextAction": { /* FlowAction (optional) — step after all branches complete */ }
}
```

**Important**: `children` array length MUST equal `branches` array length. Each entry is the first action of the corresponding branch, or `null`.

---

## Branch Conditions

### BranchOperator Enum

#### Text Operators (require `firstValue`, `secondValue`, optional `caseSensitive`)
| Operator | Value |
|----------|-------|
| Text Contains | `TEXT_CONTAINS` |
| Text Does Not Contain | `TEXT_DOES_NOT_CONTAIN` |
| Text Exactly Matches | `TEXT_EXACTLY_MATCHES` |
| Text Does Not Exactly Match | `TEXT_DOES_NOT_EXACTLY_MATCH` |
| Text Starts With | `TEXT_START_WITH` |
| Text Does Not Start With | `TEXT_DOES_NOT_START_WITH` |
| Text Ends With | `TEXT_ENDS_WITH` |
| Text Does Not End With | `TEXT_DOES_NOT_END_WITH` |

#### List Operators (require `firstValue`, `secondValue`)
| Operator | Value |
|----------|-------|
| List Contains | `LIST_CONTAINS` |
| List Does Not Contain | `LIST_DOES_NOT_CONTAIN` |

#### Number Operators (require `firstValue`, `secondValue`)
| Operator | Value |
|----------|-------|
| Greater Than | `NUMBER_IS_GREATER_THAN` |
| Less Than | `NUMBER_IS_LESS_THAN` |
| Equal To | `NUMBER_IS_EQUAL_TO` |

#### Date Operators (require `firstValue`, `secondValue`)
| Operator | Value |
|----------|-------|
| Before | `DATE_IS_BEFORE` |
| Equal | `DATE_IS_EQUAL` |
| After | `DATE_IS_AFTER` |

#### Single-Value Operators (require only `firstValue`)
| Operator | Value |
|----------|-------|
| Exists | `EXISTS` |
| Does Not Exist | `DOES_NOT_EXIST` |
| Boolean Is True | `BOOLEAN_IS_TRUE` |
| Boolean Is False | `BOOLEAN_IS_FALSE` |
| List Is Empty | `LIST_IS_EMPTY` |
| List Is Not Empty | `LIST_IS_NOT_EMPTY` |

---

## PropertySettings

Each property in `input` should have a matching entry in `propertySettings`:

```jsonc
{
  "type": "MANUAL" | "DYNAMIC"
}
```

- `MANUAL` — Static input value, determined at design time
- `DYNAMIC` — Schema determined at runtime based on other inputs (e.g., a dropdown whose options depend on the selected auth)

---

## Expression Syntax

| Pattern | Description | Example |
|---------|-------------|---------|
| `{{trigger['field']}}` | Trigger output field | `{{trigger['text']}}` |
| `{{step_N['field']}}` | Step output field | `{{step_1['data']['rows']}}` |
| `{{step_N.field}}` | Step output (dot notation) | `{{step_1.id}}` |
| `{{connections['name']}}` | Connection reference | `{{connections['slack']}}` |
| `{{step_N['item']}}` | Loop current item | `{{step_2['item']}}` |
| `{{step_N['item']['field']}}` | Loop item field | `{{step_2['item']['email']}}` |
| `{{step_N['index']}}` | Loop current index | `{{step_2['index']}}` |

Expressions can be embedded in strings: `"Hello {{trigger['name']}}, your ID is {{step_1['id']}}"`

---

## Notes

### Note Object

```jsonc
{
  "id": "<string>",                          // Unique ID, e.g. "note_original_prompt"
  "content": "<string>",                     // Text content (supports \n for newlines)
  "ownerId": null,
  "color": "yellow" | "blue" | "orange" | "purple",
  "position": { "x": <number>, "y": <number> },   // Absolute canvas coordinates
  "size": { "width": <number>, "height": <number> },
  "createdAt": "<ISO timestamp>",
  "updatedAt": "<ISO timestamp>"
}
```

### Canvas Layout & Note Positioning

Notes use absolute canvas coordinates. To position a note next to a specific step, you must calculate that step's Y position on the canvas.

**Layout constants** (from `packages/react-ui/src/app/builder/flow-canvas/utils/consts.ts`):

| Constant | Value | Description |
|----------|-------|-------------|
| `STEP_HEIGHT` | 60 | Height of a step node |
| `VERTICAL_SPACE` | 60 | Vertical gap between steps |
| `ARC_LENGTH` | 15 | Arc radius for loop/router edges |
| `LOOP_CHILD_OFFSET` | 120 | `VERTICAL_SPACE × 1.5 + 2 × ARC_LENGTH` |
| `LABEL_HEIGHT` | 30 | Height of a router branch label |
| `ROUTER_CHILD_OFFSET` | 150 | `LOOP_CHILD_OFFSET + LABEL_HEIGHT` |

**Step height** = `STEP_HEIGHT + VERTICAL_SPACE` = **120** (each linear step contributes 120px)

**Calculating absolute Y positions** — walk the flow top-down, accumulating Y:

1. **Trigger** is at `y = 0`
2. Each **linear step** (PIECE, CODE) adds **120** to the running Y
3. A **Router** step is at the current Y, then:
   - Its children start at `y_router + STEP_HEIGHT + ROUTER_CHILD_OFFSET` = `y_router + 210`
   - Child steps within a branch accumulate normally from that offset
   - Total router height = `STEP_HEIGHT + ROUTER_CHILD_OFFSET + max_branch_height + ARC_LENGTH + VERTICAL_SPACE`
4. A **Loop** step is at the current Y, then:
   - Its child starts at `y_loop + STEP_HEIGHT + LOOP_CHILD_OFFSET` = `y_loop + 180`
   - Child steps within the loop accumulate normally from that offset
   - Total loop height = `STEP_HEIGHT + LOOP_CHILD_OFFSET + child_graph_height + ARC_LENGTH + VERTICAL_SPACE`

**X positioning for notes:**
- Step nodes are centered at `x = 116` (half of step width 232), left edge at `x = 0`
- Notes to the **left** of a step: `x ≈ -400` (with note width ~250, leaves a gap)
- Notes to the **right** of a step: `x ≈ 300` (just past the right edge at 232)

**Example** — flow: trigger → step_1 → step_2 (Router) → step_3 (Loop, in branch) → step_4 (Slack, in loop):

| Step | Absolute Y | Calculation |
|------|-----------|-------------|
| trigger | 0 | Start |
| step_1 | 120 | 0 + 120 |
| step_2 (Router) | 240 | 120 + 120 |
| step_3 (Loop, inside branch 0) | 450 | 240 + 210 |
| step_4 (inside loop) | 630 | 450 + 180 |

---

## Version Pattern

Piece versions follow semver with optional prefix:
- `"0.10.19"` — exact version
- `"~0.7.13"` — tilde: patch updates only
- `"^1.0.0"` — caret: compatible versions

For generated flows, prefer tilde prefix (`~`) with the latest known version.
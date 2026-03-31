export type ToolMeta = { name: string; description: string };
export type ToolCategory = {
  label: string;
  tools: ToolMeta[];
  locked?: boolean;
};

// NOTE: Keep this list in sync with ALL_CONTROLLABLE_TOOL_NAMES and LOCKED_TOOL_NAMES in
// packages/server/api/src/app/mcp/tools/index.ts
// Any tool added to the backend index must also be added here so it appears in the UI settings panel.
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    label: 'Discovery',
    locked: true,
    tools: [
      {
        name: 'ap_list_flows',
        description: 'List all flows in the current project',
      },
      {
        name: 'ap_flow_structure',
        description:
          'Get the structure of a flow: step tree, configuration status, and valid insert locations',
      },
      {
        name: 'ap_list_pieces',
        description:
          'List pieces with actions and triggers — required before adding or updating steps',
      },
      {
        name: 'ap_list_connections',
        description:
          'List OAuth/app connections in the project — required before adding steps that need auth',
      },
      {
        name: 'ap_list_ai_models',
        description: 'List configured AI providers and their available models',
      },
      {
        name: 'ap_list_tables',
        description: 'List all tables and their fields in the current project',
      },
      {
        name: 'ap_find_records',
        description: 'Query records from a table with optional filtering',
      },
      {
        name: 'ap_list_runs',
        description: 'List recent flow runs with optional filters',
      },
      {
        name: 'ap_get_run',
        description:
          'Get detailed results of a flow run including step outputs and errors',
      },
      {
        name: 'ap_setup_guide',
        description:
          'Get instructions for setting up connections or AI providers',
      },
    ],
  },
  {
    label: 'Flow Management',
    tools: [
      {
        name: 'ap_create_flow',
        description: 'Create a new flow',
      },
      {
        name: 'ap_rename_flow',
        description: 'Rename an existing flow',
      },
      {
        name: 'ap_change_flow_status',
        description: 'Enable or disable a flow',
      },
      {
        name: 'ap_lock_and_publish',
        description: 'Publish the current draft of a flow',
      },
    ],
  },
  {
    label: 'Flow Building',
    tools: [
      {
        name: 'ap_update_trigger',
        description: 'Set or update the trigger for a flow',
      },
      {
        name: 'ap_add_step',
        description: 'Add a new step to a flow',
      },
      {
        name: 'ap_update_step',
        description: "Update an existing step's settings",
      },
      {
        name: 'ap_delete_step',
        description: 'Delete a step from a flow',
      },
    ],
  },
  {
    label: 'Router & Branching',
    tools: [
      {
        name: 'ap_add_branch',
        description: 'Add a conditional branch to a router step',
      },
      {
        name: 'ap_delete_branch',
        description: 'Delete a branch from a router step',
      },
    ],
  },
  {
    label: 'Annotations',
    tools: [
      {
        name: 'ap_manage_notes',
        description: 'Add, update, or delete canvas notes on a flow',
      },
    ],
  },
  {
    label: 'Tables',
    tools: [
      {
        name: 'ap_create_table',
        description: 'Create a new table with initial fields',
      },
      {
        name: 'ap_delete_table',
        description: 'Permanently delete a table and all its data',
      },
      {
        name: 'ap_manage_fields',
        description: 'Add, rename, or delete fields on a table',
      },
      {
        name: 'ap_insert_records',
        description: 'Insert one or more records into a table',
      },
      {
        name: 'ap_update_record',
        description: 'Update specific cells in a record',
      },
      {
        name: 'ap_delete_records',
        description: 'Delete records by their IDs',
      },
    ],
  },
  {
    label: 'Testing & Runs',
    tools: [
      {
        name: 'ap_test_flow',
        description: 'Test a flow end-to-end and get step-by-step results',
      },
      {
        name: 'ap_test_step',
        description: 'Test a single step within a flow',
      },
      {
        name: 'ap_retry_run',
        description: 'Retry a failed flow run',
      },
    ],
  },
];

export const ALL_CONTROLLABLE_TOOL_NAMES: string[] = TOOL_CATEGORIES.filter(
  (c) => !c.locked,
).flatMap((c) => c.tools.map((t) => t.name));

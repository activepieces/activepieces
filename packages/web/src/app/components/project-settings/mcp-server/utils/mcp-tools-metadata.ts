export type ToolMeta = { name: string; description: string };
export type ToolCategory = {
  label: string;
  tools: ToolMeta[];
  locked?: boolean;
};

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
];

export const ALL_CONTROLLABLE_TOOL_NAMES: string[] = TOOL_CATEGORIES.filter(
  (c) => !c.locked,
).flatMap((c) => c.tools.map((t) => t.name));

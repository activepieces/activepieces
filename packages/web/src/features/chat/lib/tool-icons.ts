import {
  Activity,
  BookOpen,
  Braces,
  Code,
  Columns3,
  Copy,
  FlaskConical,
  GitBranch,
  Globe,
  Image,
  Link,
  List,
  ListFilter,
  type LucideIcon,
  Network,
  Pencil,
  Play,
  Plug,
  Plus,
  Power,
  Rocket,
  RotateCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  Table,
  Trash2,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';

function normalizeToolName(raw: string): string {
  const mcpMatch = /^mcp__[^_]+__(.+)$/.exec(raw);
  return mcpMatch ? mcpMatch[1] : raw;
}

function getToolIcon(toolName: string): LucideIcon {
  return TOOL_ICONS[normalizeToolName(toolName)] ?? DEFAULT_TOOL_ICON;
}

const DEFAULT_TOOL_ICON: LucideIcon = Wrench;

const TOOL_ICONS: Record<string, LucideIcon> = {
  ap_research_pieces: Search,
  ap_web_search: Globe,
  ap_explore_data: Search,
  ap_find_records: Search,
  ap_list_across_projects: List,
  ap_list_flows: List,
  ap_list_runs: List,
  ap_list_tables: List,
  ap_list_connections: Plug,
  ap_list_ai_models: Sparkles,
  ap_get_piece_props: SlidersHorizontal,
  ap_resolve_property_options: ListFilter,
  ap_resolve_property_chain: ListFilter,

  ap_build_flow: Workflow,
  ap_create_flow: Plus,
  ap_add_step: Plus,
  ap_update_step: Pencil,
  ap_delete_step: Trash2,
  ap_update_trigger: Zap,
  ap_add_branch: GitBranch,
  ap_update_branch: GitBranch,
  ap_delete_branch: GitBranch,
  ap_rename_flow: Pencil,
  ap_duplicate_flow: Copy,
  ap_delete_flow: Trash2,
  ap_flow_structure: Network,
  ap_read_step_code: Code,

  ap_validate_flow: ShieldCheck,
  ap_validate_step_config: ShieldCheck,
  ap_test_flow: FlaskConical,
  ap_test_step: FlaskConical,
  ap_execute_action: Play,
  ap_run_action: Play,
  ap_get_run: Activity,
  ap_retry_run: RotateCw,
  ap_lock_and_publish: Rocket,
  ap_change_flow_status: Power,

  ap_discover_action_auth: Plug,
  ap_show_mcp_reconnect: RotateCw,

  ap_create_table: Table,
  ap_insert_records: Plus,
  ap_update_record: Pencil,
  ap_delete_records: Trash2,
  ap_manage_fields: Columns3,

  ap_manage_notes: StickyNote,
  ap_load_guide: BookOpen,
  ap_generate_image: Image,
  ap_run_code: Code,
  ap_run_tools: Braces,
  ap_fetch_url: Link,
  ap_scrape_url: Globe,
};

export const toolIconUtils = { getToolIcon };

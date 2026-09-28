import {
  Add01Icon,
  AiMagicIcon,
  BookOpen01Icon,
  ColumnInsertIcon,
  Copy01Icon,
  Delete02Icon,
  FilterHorizontalIcon,
  FlashIcon,
  GitBranchIcon,
  Globe02Icon,
  Image01Icon,
  LeftToRightListBulletIcon,
  Link02Icon,
  PencilEdit01Icon,
  PlayIcon,
  PlugSocketIcon,
  PowerIcon,
  PreferenceHorizontalIcon,
  Pulse01Icon,
  RefreshIcon,
  Rocket01Icon,
  Search01Icon,
  SecurityCheckIcon,
  SourceCodeIcon,
  StickyNote01Icon,
  Structure01Icon,
  TableIcon,
  TestTube01Icon,
  WorkflowSquare02Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';

import { type IconSvgElement } from '@/components/custom/hugeicons-icon';

function normalizeToolName(raw: string): string {
  const mcpMatch = /^mcp__[^_]+__(.+)$/.exec(raw);
  return mcpMatch ? mcpMatch[1] : raw;
}

function getToolIcon(toolName: string): IconSvgElement {
  return TOOL_ICONS[normalizeToolName(toolName)] ?? DEFAULT_TOOL_ICON;
}

const DEFAULT_TOOL_ICON: IconSvgElement = Wrench01Icon;

const TOOL_ICONS: Record<string, IconSvgElement> = {
  ap_research_pieces: Search01Icon,
  ap_web_search: Globe02Icon,
  ap_explore_data: Search01Icon,
  ap_find_records: Search01Icon,
  ap_list_across_projects: LeftToRightListBulletIcon,
  ap_list_flows: LeftToRightListBulletIcon,
  ap_list_runs: LeftToRightListBulletIcon,
  ap_list_tables: LeftToRightListBulletIcon,
  ap_list_connections: PlugSocketIcon,
  ap_list_ai_models: AiMagicIcon,
  ap_get_piece_props: PreferenceHorizontalIcon,
  ap_resolve_property_options: FilterHorizontalIcon,
  ap_resolve_property_chain: FilterHorizontalIcon,

  ap_build_flow: WorkflowSquare02Icon,
  ap_create_flow: Add01Icon,
  ap_add_step: Add01Icon,
  ap_update_step: PencilEdit01Icon,
  ap_delete_step: Delete02Icon,
  ap_update_trigger: FlashIcon,
  ap_add_branch: GitBranchIcon,
  ap_update_branch: GitBranchIcon,
  ap_delete_branch: GitBranchIcon,
  ap_rename_flow: PencilEdit01Icon,
  ap_duplicate_flow: Copy01Icon,
  ap_delete_flow: Delete02Icon,
  ap_flow_structure: Structure01Icon,
  ap_read_step_code: SourceCodeIcon,
  ap_read_step_settings: PreferenceHorizontalIcon,

  ap_validate_flow: SecurityCheckIcon,
  ap_validate_step_config: SecurityCheckIcon,
  ap_test_flow: TestTube01Icon,
  ap_test_step: TestTube01Icon,
  ap_execute_action: PlayIcon,
  ap_run_action: PlayIcon,
  ap_get_run: Pulse01Icon,
  ap_retry_run: RefreshIcon,
  ap_lock_and_publish: Rocket01Icon,
  ap_change_flow_status: PowerIcon,

  ap_discover_action_auth: PlugSocketIcon,
  ap_show_mcp_reconnect: RefreshIcon,

  ap_create_table: TableIcon,
  ap_insert_records: Add01Icon,
  ap_update_record: PencilEdit01Icon,
  ap_delete_records: Delete02Icon,
  ap_manage_fields: ColumnInsertIcon,

  ap_manage_notes: StickyNote01Icon,
  ap_load_guide: BookOpen01Icon,
  ap_generate_image: Image01Icon,
  ap_run_code: SourceCodeIcon,
  ap_fetch_url: Link02Icon,
  ap_scrape_url: Globe02Icon,
};

export const toolIconUtils = { getToolIcon };

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { t } from "i18next";
import { McpCredentials } from "./mcp-credentials";
import { McpFlows } from "./mcp-flows";
import { mcpHooks } from "./utils/mcp-hooks";
import { authenticationSession } from "@/lib/authentication-session";
import { LoadingSpinner } from "@/components/ui/spinner";
import { McpServerStatus } from "@activepieces/shared";

export const McpServerSettings = () => {
  const currentProjectId = authenticationSession.getProjectId();
  const { data: mcpServer, isLoading } = mcpHooks.useMcpServer(currentProjectId!);
  const { mutate: updateMcpServer, isPending: isUpdating } = mcpHooks.useUpdateMcpServer(currentProjectId!);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const isEnabled = mcpServer?.status === McpServerStatus.ENABLED;

  const handleStatusChange = (checked: boolean) => {
    updateMcpServer({
      status: checked ? McpServerStatus.ENABLED : McpServerStatus.DISABLED,
    });
  };

  return (
    <div className="w-full mt-4">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="mcp-access">Enable MCP Access</FieldLabel>
          <FieldDescription>
            {t('Enable Model Context Protocol (MCP) server access for this project.')}
          </FieldDescription>
        </FieldContent>
        <Switch 
          id="mcp-access" 
          checked={isEnabled}
          onCheckedChange={handleStatusChange}
          disabled={isUpdating}
        />
      </Field>
    {mcpServer?.status === McpServerStatus.ENABLED && (
      <div className="mt-8 space-y-8">
          <div>
            <h3 className="font-semibold text-base mb-2">{t('How to Connect')}</h3>
            {mcpServer && <McpCredentials mcpServer={mcpServer} />}
          </div>
          <div>
            <h3 className="font-semibold text-base mb-2">{t('Available Flows')}</h3>
            {mcpServer && <McpFlows mcpServer={mcpServer} />}
          </div>
        </div>
      )}
    </div>
  );
};

McpServerSettings.displayName = 'McpServerSettings';

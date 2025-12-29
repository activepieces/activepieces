import { Type, Static } from '@sinclair/typebox';
import { t } from 'i18next';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AgentMcpTool,
  AgentTool,
  AgentToolType,
  McpAuthConfig,
  McpAuthType,
  McpProtocol,
} from '@activepieces/shared';

import { useAgentToolsStore } from '../store';

const McpToolFormSchema = Type.Object({
  toolName: Type.String({ minLength: 1 }),
  serverUrl: Type.String({ format: 'uri' }),
  protocol: Type.Enum(McpProtocol),
  authType: Type.Enum(McpAuthType),

  accessToken: Type.Optional(Type.String()),

  apiKeyHeader: Type.Optional(Type.String()),
  apiKey: Type.Optional(Type.String()),

  headers: Type.Optional(
    Type.Array(
      Type.Object({
        key: Type.String(),
        value: Type.String(),
      }),
    ),
  ),
});
type McpToolFormData = Static<typeof McpToolFormSchema>;

type AgentToolsDialogProps = {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
};

export function AgentMcpDialog({
  tools,
  onToolsUpdate,
}: AgentToolsDialogProps) {
  const { showAddMcpDialog, setShowAddMcpDialog, editingMcpTool } =
    useAgentToolsStore();

  const isToolNameUnique = (value: string) => {
    return !tools.some(
      (tool) =>
        tool.toolName === value && tool.toolName !== editingMcpTool?.toolName,
    );
  };

  const form = useForm<McpToolFormData>({
    defaultValues: {
      toolName: '',
      serverUrl: '',
      protocol: McpProtocol.STREAMABLE_HTTP,
      authType: McpAuthType.NONE,
      accessToken: '',
      apiKey: '',
      apiKeyHeader: 'X-API-Key',
      headers: [{ key: '', value: '' }],
    },
    mode: 'onChange',
  });

  const authType = form.watch('authType');
  const headers = form.watch('headers');

  useEffect(() => {
    if (editingMcpTool) {
      form.reset({
        toolName: editingMcpTool.toolName,
        serverUrl: editingMcpTool.serverUrl,
        protocol: editingMcpTool.protocol,
        authType: editingMcpTool.auth.type,
        ...(editingMcpTool.auth.type === McpAuthType.ACCESS_TOKEN && {
          accessToken: editingMcpTool.auth.accessToken,
        }),
        ...(editingMcpTool.auth.type === McpAuthType.API_KEY && {
          apiKey: editingMcpTool.auth.apiKey,
          apiKeyHeader: editingMcpTool.auth.apiKeyHeader,
        }),
        ...(editingMcpTool.auth.type === McpAuthType.HEADERS && {
          headers: Object.entries(editingMcpTool.auth.headers).map(
            ([key, value]) => ({
              key,
              value,
            }),
          ),
        }),
      });
    }
  }, [editingMcpTool, form]);

  const onSubmit = (data: McpToolFormData) => {
    let auth;
    switch (data.authType) {
      case McpAuthType.NONE: {
        auth = { type: McpAuthType.NONE };
        break;
      }
      case McpAuthType.ACCESS_TOKEN: {
        auth = {
          type: McpAuthType.ACCESS_TOKEN,
          accessToken: data.accessToken,
        };
        break;
      }
      case McpAuthType.API_KEY: {
        auth = {
          type: McpAuthType.API_KEY,
          apiKey: data.apiKey,
          apiKeyHeader: data.apiKeyHeader,
        };
        break;
      }
      case McpAuthType.HEADERS: {
        const headersObj: Record<string, string> = {};
        data.headers?.forEach(({ key, value }) => {
          if (key && value) {
            headersObj[key] = value;
          }
        });
        auth = {
          type: McpAuthType.HEADERS,
          headers: headersObj,
        };
        break;
      }
      default: {
        auth = { type: McpAuthType.NONE };
      }
    }

    const mcpTool: AgentMcpTool = {
      type: AgentToolType.MCP,
      toolName: `${data.toolName}`,
      serverUrl: data.serverUrl,
      protocol: data.protocol,
      auth: auth as McpAuthConfig,
    };

    if (editingMcpTool) {
      const updatedTools = tools.map((tool) =>
        tool.type === AgentToolType.MCP &&
        tool.toolName === editingMcpTool.toolName
          ? mcpTool
          : tool,
      );
      onToolsUpdate(updatedTools);
    } else {
      onToolsUpdate([...tools, mcpTool]);
    }

    form.reset();
    setShowAddMcpDialog(false);
    toast(t('MCP server added successfully'));
  };

  const addHeaderField = () => {
    form.setValue('headers', [...(headers || []), { key: '', value: '' }]);
  };

  const removeHeaderField = (index: number) => {
    const newHeaders = headers?.filter((_, i) => i !== index) || [];
    form.setValue(
      'headers',
      newHeaders.length > 0 ? newHeaders : [{ key: '', value: '' }],
    );
  };

  const handleClose = () => {
    form.reset();
    setShowAddMcpDialog(false);
  };

  return (
    <Dialog open={showAddMcpDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingMcpTool ? t('Edit MCP Server') : t('Add MCP Server')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="toolName"
              rules={{
                required: 'Tool name is required',
                minLength: { value: 1, message: 'Tool name is required' },
                validate: (value) =>
                  isToolNameUnique(value) ||
                  t('An MCP server with this name already exists'),
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('MCP Name')} *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., my-mcp-server" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serverUrl"
              rules={{
                required: 'Server URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Must be a valid URL',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Server URL')} *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/mcp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="protocol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Protocol')} *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={McpProtocol.SSE}>
                        {t('SSE')}
                      </SelectItem>
                      <SelectItem value={McpProtocol.SIMPLE_HTTP}>
                        {t('Simple HTTP')}
                      </SelectItem>
                      <SelectItem value={McpProtocol.STREAMABLE_HTTP}>
                        {t('Streamable HTTP')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Authentication Type')} *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={McpAuthType.NONE}>
                        {t('None')}
                      </SelectItem>
                      <SelectItem value={McpAuthType.HEADERS}>
                        {t('Headers')}
                      </SelectItem>
                      <SelectItem value={McpAuthType.ACCESS_TOKEN}>
                        {t('Access Token')}
                      </SelectItem>
                      <SelectItem value={McpAuthType.API_KEY}>
                        {t('Api Key')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {authType === McpAuthType.ACCESS_TOKEN && (
              <div className="space-y-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name="accessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Access Token')} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter access token" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {authType === McpAuthType.API_KEY && (
              <div className="space-y-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name="apiKeyHeader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('API Key Header')} *</FormLabel>
                      <FormControl>
                        <Input placeholder="X-API-KEY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Api Key')} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter API Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {authType === McpAuthType.HEADERS && (
              <div className="space-y-4 p-4 border rounded-lg">
                {headers?.map((header, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex gap-2 items-end">
                      <FormField
                        control={form.control}
                        name={`headers.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Authorization" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`headers.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Bearer token..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {headers.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeHeaderField(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={addHeaderField}
                >
                  {t('+ Add Header')}
                </Button>
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('Cancel')}
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={!form.formState.isValid}
              >
                {editingMcpTool ? t('Update Server') : t('Add Server')}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

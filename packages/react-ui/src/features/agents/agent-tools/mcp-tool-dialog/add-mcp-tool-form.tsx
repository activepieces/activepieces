import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Form,
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
import { authenticationSession } from '@/lib/authentication-session';
import {
  AgentMcpTool,
  AgentTool,
  AgentToolType,
  McpAuthConfig,
  McpAuthType,
  McpProtocol,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';

import { useMcpToolDialogStore } from '../stores/mcp-tools';

import { mcpToolApi } from './api';

import { McpToolFormData, ValidationStep } from '.';

type AddMcpToolFormProps = {
  tools: AgentTool[];
  form: UseFormReturn<McpToolFormData>;
  setValidationResult: (data: ValidateAgentMcpToolResponse | null) => void;
  setStep: (step: ValidationStep) => void;
  setPendingTool: (tool: AgentMcpTool) => void;
  handleClose: () => void;
};

export const AddMcpToolForm = ({
  tools,
  form,
  setStep,
  setValidationResult,
  setPendingTool,
  handleClose,
}: AddMcpToolFormProps) => {
  const projectId = authenticationSession.getProjectId();
  const { editingMcpTool } = useMcpToolDialogStore();

  const { mutate: validateTool } = useMutation<
    ValidateAgentMcpToolResponse,
    Error,
    { projectId: string; tool: AgentMcpTool }
  >({
    mutationFn: ({ projectId, tool }) =>
      mcpToolApi.validateAgentMcpTool(projectId, tool),
    onSuccess: (data) => {
      setValidationResult(data);
      setStep('validated');
    },
    onError: (error) => {
      setValidationResult({ error: error.message, toolNames: undefined });
      setStep('validated');
    },
  });

  const authType = form.watch('authType');
  const headers = form.watch('headers');

  const isToolNameUnique = (value: string) => {
    return !tools.some(
      (tool) =>
        tool.toolName === value && tool.toolName !== editingMcpTool?.toolName,
    );
  };

  const buildAuthConfig = (data: McpToolFormData): McpAuthConfig => {
    let auth: McpAuthConfig;

    switch (data.authType) {
      case McpAuthType.ACCESS_TOKEN: {
        auth = {
          type: McpAuthType.ACCESS_TOKEN,
          accessToken: data.accessToken!,
        };
        break;
      }
      case McpAuthType.API_KEY: {
        auth = {
          type: McpAuthType.API_KEY,
          apiKey: data.apiKey!,
          apiKeyHeader: data.apiKeyHeader!,
        };
        break;
      }
      case McpAuthType.HEADERS: {
        const headersObj: Record<string, string> = {};
        data.headers?.forEach(({ key, value }) => {
          if (key && value) headersObj[key] = value;
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

    return auth;
  };
  const handleValidate = (data: McpToolFormData) => {
    const mcpTool: AgentMcpTool = {
      type: AgentToolType.MCP,
      toolName: data.toolName,
      serverUrl: data.serverUrl,
      protocol: data.protocol,
      auth: buildAuthConfig(data),
    };

    setPendingTool(mcpTool);
    setStep('validating');
    validateTool({ projectId: projectId!, tool: mcpTool });
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
  return (
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
                  <SelectItem value={McpProtocol.SSE}>{t('SSE')}</SelectItem>
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
                  <SelectItem value={McpAuthType.NONE}>{t('None')}</SelectItem>
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
              <div key={index} className="flex gap-2 items-end">
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

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={form.handleSubmit(handleValidate)}
            disabled={!form.formState.isValid}
          >
            {t('Validate Server')}
          </Button>
        </DialogFooter>
      </div>
    </Form>
  );
};

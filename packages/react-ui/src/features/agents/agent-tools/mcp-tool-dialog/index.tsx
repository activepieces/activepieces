import { Type, Static } from '@sinclair/typebox';
import { t } from 'i18next';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  AgentMcpTool,
  AgentTool,
  AgentToolType,
  McpAuthType,
  McpProtocol,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';

import { useMcpToolDialogStore } from '../stores/mcp-tools';

import { AddMcpToolForm } from './add-mcp-tool-form';

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

export type McpToolFormData = Static<typeof McpToolFormSchema>;

type AgentToolsDialogProps = {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
};

export type ValidationStep = 'form' | 'validating' | 'validated';

export function AgentMcpDialog({
  tools,
  onToolsUpdate,
}: AgentToolsDialogProps) {
  const { showAddMcpDialog, editingMcpTool, closeMcpDialog } =
    useMcpToolDialogStore();
  const [step, setStep] = useState<ValidationStep>('form');
  const [validationResult, setValidationResult] =
    useState<ValidateAgentMcpToolResponse | null>(null);
  const [pendingTool, setPendingTool] = useState<AgentMcpTool | null>(null);

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

  const handleAddTool = () => {
    if (!pendingTool) return;

    if (editingMcpTool) {
      const updatedTools = tools.map((tool) =>
        tool.type === AgentToolType.MCP &&
        tool.toolName === editingMcpTool.toolName
          ? pendingTool
          : tool,
      );
      onToolsUpdate(updatedTools);
      toast(t('MCP server updated successfully'));
    } else {
      onToolsUpdate([...tools, pendingTool]);
      toast(t('MCP server added successfully'));
    }

    handleClose();
  };

  const handleBackToForm = () => {
    setStep('form');
    setValidationResult(null);
  };

  const handleClose = () => {
    form.reset();
    setStep('form');
    setValidationResult(null);
    setPendingTool(null);
    closeMcpDialog();
  };

  return (
    <Dialog open={showAddMcpDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        {step === 'form' && (
          <DialogHeader>
            <DialogTitle>
              {editingMcpTool ? t('Edit MCP Server') : t('Add MCP Server')}
            </DialogTitle>
          </DialogHeader>
        )}

        {step === 'form' && (
          <AddMcpToolForm
            tools={tools}
            form={form}
            handleClose={handleClose}
            setPendingTool={setPendingTool}
            setStep={setStep}
            setValidationResult={setValidationResult}
          />
        )}

        {step === 'validating' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {t('Connecting to MCP Server')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('Validating server configuration...')}
              </p>
            </div>
          </div>
        )}

        {step === 'validated' && validationResult && (
          <div className="space-y-6">
            {validationResult.error ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">
                    {t('Connection Failed')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {validationResult.error}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-success-100 p-3">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">
                    {t('Connection Successful')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('Available tools from MCP server:')}
                  </p>
                </div>

                {validationResult.toolNames &&
                  validationResult.toolNames.length > 0 && (
                    <div className="w-full max-w-md border rounded-lg p-4 space-y-2">
                      {validationResult.toolNames.map((tool, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span className="text-sm font-medium">{tool}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToForm}
              >
                {t('Back')}
              </Button>
              {!validationResult.error && (
                <Button onClick={handleAddTool}>
                  {editingMcpTool ? t('Update Server') : t('Add Server')}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useMutation } from '@tanstack/react-query';
import { Settings, History, Link2, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import EditableTextWithPen from '@/components/ui/editable-text-with-pen';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mcpApi } from '@/features/mcp/lib/mcp-api';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { NEW_MCP_QUERY_PARAM } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { McpConfigPage } from './mcp-config';
import { McpConnectPage } from './mcp-connect';
import { McpHistoryPage } from './runs/mcp-runs';

const tabs = [
  {
    name: 'Configure',
    value: 'configure',
    icon: Settings,
  },
  {
    name: 'Connect',
    value: 'connect',
    icon: Link2,
  },
  {
    name: 'History',
    value: 'history',
    icon: History,
  },
];

const McpServerPage = () => {
  const { mcpId } = useParams();
  const { data: mcp, refetch, isLoading } = mcpHooks.useMcp(mcpId!);
  const { mutate: updateMcp } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      mcpApi.update(id, { name }),
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditingName, setIsEditingName] = useState(
    searchParams.get(NEW_MCP_QUERY_PARAM) === 'true',
  );
  const [mcpName, setMcpName] = useState('');

  useEffect(() => {
    if (isNil(mcp)) {
      return;
    }
    setMcpName(mcp?.name || '');
  }, [mcp?.name]);

  const handleNameChange = (newName: string) => {
    if (mcp && newName.trim() && newName !== mcp.name) {
      setMcpName(newName.trim());

      updateMcp({
        id: mcp.id,
        name: newName.trim(),
      });
      refetch();
    }
  };

  if (isLoading) {
    return <LoadingScreen mode="container" />;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="p-2"
            onClick={() => {
              navigate('/mcps');
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <EditableTextWithPen
            value={mcpName}
            onValueChange={handleNameChange}
            isEditing={isEditingName}
            setIsEditing={setIsEditingName}
            textClassName="text-2xl font-bold"
          />
        </div>
        <Tabs defaultValue={tabs[0].value} className="w-full">
          <TabsList variant="outline">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} variant="outline">
                <tab.icon className="h-4 w-4 mr-2" /> {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="w-full mt-4">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="w-full mt-0"
              >
                {tab.value === 'configure' && <McpConfigPage />}
                {tab.value === 'connect' && <McpConnectPage />}
                {tab.value === 'history' && <McpHistoryPage />}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

McpServerPage.displayName = 'McpServerPage';

export default McpServerPage;

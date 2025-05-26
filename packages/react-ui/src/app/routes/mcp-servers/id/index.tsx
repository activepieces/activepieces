import { Settings, History, Link2, ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';

import { McpHistoryPage } from '../../../mcp/history/mcp-history';
import { McpConfigPage } from '../../../mcp/mcp-config';
import { McpConnectPage } from '../../../mcp/mcp-connect';

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
  const { data: mcp } = mcpHooks.useMcp(mcpId!);
  const navigate = useNavigate();
  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="p-2"
            onClick={() => {
              navigate('/mcp');
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{mcp?.name}</h1>
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

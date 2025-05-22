import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, History, Link2 } from "lucide-react";
import { t } from 'i18next';
import { TableTitle } from '@/components/ui/table-title';
import { McpConfigPage } from '../../mcp/mcp-config';
import { McpConnectPage } from '../../mcp/mcp-connect';
import { McpHistoryPage } from '../../mcp/mcp-history';


const tabs = [
  {
    name: "Configure",
    value: "configure",
    icon: Settings,
  },
  {
    name: "Connect",
    value: "connect",
    icon: Link2,
  },
  {
    name: "History",
    value: "history",
    icon: History,
  },
];

const McpPage = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 pb-12">
      <div className="w-full flex flex-col gap-4">
        <TableTitle
              beta={true}
              description={t(
                'Connect to your hosted MCP Server using any MCP client to communicate with tools',
              )}
            >
              {t('MCP Server')}
        </TableTitle>
        <Tabs
          defaultValue={tabs[0].value}
          className="w-full"
        >
          <TabsList variant="outline">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} variant="outline">
                <tab.icon className="h-4 w-4 mr-2" /> {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="w-full mt-4">
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="w-full mt-0">
                {tab.value === "configure" && (
                  <McpConfigPage />
                )}
                {tab.value === "connect" && (
                  <McpConnectPage />
                )}
                {tab.value === "history" && (
                  <McpHistoryPage />
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

McpPage.displayName = 'McpPage';

export default McpPage;
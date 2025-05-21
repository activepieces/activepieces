import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, SunMoon, History } from "lucide-react";
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
    icon: SunMoon,
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
      <div className="w-full space-y-8">
        <div className="flex items-center gap-2">
          <TableTitle
            beta={true}
            description={t(
              'Connect to your hosted MCP Server using any MCP client to communicate with tools',
            )}
          >
            {t('MCP Server')}
          </TableTitle>
        </div>
        <Tabs
          orientation="vertical"
          defaultValue={tabs[0].value}
          className="w-full flex"
        >
          <div className="flex flex-col md:flex-row w-full gap-6">
            <TabsList className="shrink-0 grid grid-cols-1 w-full md:w-48 p-0 bg-background">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="border-l-2 border-transparent justify-start rounded-none data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary/5 py-1.5"
                >
                  <tab.icon className="h-5 w-5 me-2" /> {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1 w-full">
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
          </div>
        </Tabs>
      </div>
    </div>
  );
};

McpPage.displayName = 'McpPage';

export default McpPage;
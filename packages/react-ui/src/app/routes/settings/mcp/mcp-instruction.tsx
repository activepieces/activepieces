import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import claude from '@/assets/img/custom/claude.svg';
import cursor from '@/assets/img/custom/cursor.svg';
import windsurf from '@/assets/img/custom/windsurf.svg';
import { JsonViewer } from '../../../../components/json-viewer';

type McpInstructionProps = {
    mcpServerUrl: string;
};

export const McpInstruction = ({ mcpServerUrl }: McpInstructionProps) => {
    return (
        <div >
            <div className="space-y-4 w-full">
                <div>
                    <h3 className="font-semibold text-foreground text-base mb-1">Client Specific Instructions</h3>
                    <p className="text-muted-foreground text-sm">
                        Follow the instructions below for your specific MCP client
                    </p>
                </div>

                <Tabs defaultValue="cursor">
                    <TabsList className="gap-3" variant="outline">
                        <TabsTrigger value="claude" variant="outline">
                          <div className="flex items-center gap-2">
                            <img src={claude} alt="Claude icon" className="w-4 h-4" />
                            <span>Claude</span>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger value="cursor" variant="outline">
                          <div className="flex items-center gap-2">
                            <img src={cursor} alt="Cursor icon" className="w-4 h-4" />
                            <span>Cursor</span>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger value="windsurf" variant="outline">
                          <div className="flex items-center gap-2">
                            <img src={windsurf} alt="Windsurf icon" className="w-4 h-4" />
                            <span>Windsurf</span>
                          </div>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="claude" className="text-muted-foreground mt-3 pl-1">
                        <p>
                            <span className="font-medium text-foreground">To use with Claude:</span> Configure Claude to use this MCP server URL
                            in your Claude settings or API configuration.
                        </p>
                    </TabsContent>

                    <TabsContent value="cursor" className="mt-4 pl-2">
                        <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
                            <li>
                                <span className="font-semibold">Navigate to</span> <strong>Settings</strong>, then <strong>Cursor Settings</strong>
                            </li>
                            <li>
                                <span className="font-semibold">Select</span> <strong>MCP</strong> on the left
                            </li>
                            <li>
                                <span className="font-semibold">Click</span> <strong>Add new global MCP server</strong> at the top right
                            </li>
                            <li>
                                <span className="font-semibold">Copy and paste</span> the server config to your existing file, then save
                            </li>
                        </ol>
                        <div className="mt-4 rounded-md shadow-sm">
                            <JsonViewer
                                hideDownload={true}
                                json={{
                                    mcpServers: {
                                        "Activepieces": {
                                            url: mcpServerUrl
                                        }
                                    }
                                }}
                                title="MCP Server Configuration"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="windsurf" className="text-muted-foreground mt-3 pl-1">
                        <p>
                            <span className="font-medium text-foreground">To use with Windsurf:</span> In Windsurf settings, navigate to the MCP
                            configuration section and add this server URL to connect your tools.
                        </p>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};
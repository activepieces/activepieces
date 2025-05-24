import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { t } from 'i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const McpHistoryPage = () => {
    const { mcpId } = useParams<{ mcpId: string }>();
    const [activeTab, setActiveTab] = useState('all');
    
    const { 
        data: mcp, 
        isLoading 
    } = mcpHooks.useMcp(mcpId!);

    // This would be replaced with actual history data from an API
    // For now we'll use dummy data
    const historyItems = [
        {
            id: '1',
            timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
            pieceName: 'OpenAI',
            actionName: 'generate-text',
            status: 'success',
            user: 'John Doe',
            details: 'Generated text using ChatGPT model'
        },
        {
            id: '2',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago 
            pieceName: 'Slack',
            actionName: 'send-message',
            status: 'success',
            user: 'Jane Smith',
            details: 'Message sent to #general channel'
        },
        {
            id: '3',
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            pieceName: 'Google Drive',
            actionName: 'upload-file',
            status: 'error',
            user: 'John Doe',
            details: 'File upload failed: Permission denied'
        }
    ];

    const filteredHistory = activeTab === 'all' 
        ? historyItems 
        : historyItems.filter(item => item.status === activeTab);

    if (isLoading) {
        return <LoadingScreen mode="container" />;
    }

    return (
        <div className="w-full space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>{t('MCP Server Usage History')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">{t('All')}</TabsTrigger>
                            <TabsTrigger value="success">{t('Success')}</TabsTrigger>
                            <TabsTrigger value="error">{t('Error')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value={activeTab}>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-3">
                                    {filteredHistory.length === 0 ? (
                                        <div className="text-center p-4 text-muted-foreground">
                                            {t('No history records found')}
                                        </div>
                                    ) : (
                                        filteredHistory.map(item => (
                                            <div 
                                                key={item.id} 
                                                className="border rounded-md p-3 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0"
                                            >
                                                <div className="space-y-1">
                                                    <div className="font-medium flex items-center gap-2">
                                                        {item.pieceName}
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-sm">{item.actionName}</span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {item.details}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {t('User')}: {item.user}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end justify-between text-sm">
                                                    <Badge 
                                                        variant={item.status === 'success' ? 'default' : 'destructive'}
                                                        className="mb-2"
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(item.timestamp, 'MMM d, yyyy h:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <div className="text-center text-xs text-muted-foreground mt-4">
                {t('Note: This is a placeholder view. Actual history tracking will be implemented in a future release.')}
            </div>
        </div>
    );
};

McpHistoryPage.displayName = 'McpHistoryPage';

export default McpHistoryPage;
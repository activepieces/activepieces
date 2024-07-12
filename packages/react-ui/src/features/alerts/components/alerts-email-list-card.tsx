import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { alertsApi } from "../lib/alerts-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@activepieces/ee-shared";

const fetchData = async () => {
    const page = await alertsApi.list({
        projectId: authenticationSession.getProjectId(),
        limit: 100,
    });
    return page.data;
};

export default function AlertsEmailsCard() {
    const { data, isLoading, isSuccess, isError } = useQuery<Alert[], Error, Alert[]>({
        queryKey: ['alerts-email-card'],
        queryFn: fetchData,
    });
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Emails</CardTitle>
                <CardDescription>Add email addresses to receive alerts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="min-h-[35px]">
                    {isLoading && <div>Loading...</div>}
                    {isError && <div>Error, please try again.</div>}
                    {Array.isArray(data) && data.map((alert: Alert) => (
                        <div className="flex items-center justify-between space-x-4" key={alert.id}>
                            <div className="flex items-center space-x-4">
                                <div>
                                    <p className="text-sm font-medium leading-none">{alert.receiver}</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <Trash className="h-4 w-4 bg-destructive-500" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button variant="outline" className="flex items-center space-x-2 mt-4">
                    <Plus className="h-4 w-4" />
                    <span>Add email</span>
                </Button>
            </CardContent>
        </Card>
    );
}
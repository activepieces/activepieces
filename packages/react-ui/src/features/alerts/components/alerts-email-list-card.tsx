import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { alertsApi } from "../lib/alerts-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@activepieces/ee-shared";
import { INTERNAL_ERROR_TOAST, useToast } from "@/components/ui/use-toast";
import { AddAlertEmailDialog } from "./add-alert-email-dialog";
const fetchData = async () => {
    const page = await alertsApi.list({
        projectId: authenticationSession.getProjectId(),
        limit: 100,
    });
    return page.data;
};

export default function AlertsEmailsCard() {

    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data, isLoading, isError, isSuccess } = useQuery<Alert[], Error, Alert[]>({
        queryKey: ['alerts-email-list'],
        queryFn: fetchData,
    });

    const deleteMutation = useMutation<void, Error, Alert>({
        mutationFn: (alert) => alertsApi.delete(alert.id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['alerts-email-list'],
                exact: true,
            });
            toast({
                title: "Success",
                description: 'Your changes have been saved.',
                duration: 3000,
            })
        },
        onError: (error) => {
            toast(INTERNAL_ERROR_TOAST)
            console.log(error);
        },
    });
    
    const clearCache = () => {
        queryClient.invalidateQueries({
            queryKey: ['alerts-email-list'],
            exact: true,
        });
    }

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
                    {isSuccess && data.length === 0 && <div className="text-center">No emails added yet.</div>}
                    {Array.isArray(data) && data.map((alert: Alert) => (
                        <div className="flex items-center justify-between space-x-4" key={alert.id}>
                            <div className="flex items-center space-x-4">
                                <div>
                                    <p className="text-sm font-medium leading-none">{alert.receiver}</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => deleteMutation.mutate(alert)}>
                                <Trash className="h-4 w-4 bg-destructive-500" />
                            </Button>
                        </div>
                    ))}
                </div>
                <AddAlertEmailDialog onAdd={clearCache} />
            </CardContent>
        </Card>
    );
}
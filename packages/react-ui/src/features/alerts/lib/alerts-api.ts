import { api } from "@/lib/api";
import { SeekPage } from "@activepieces/shared";
import { Alert, ListAlertsParams } from "@activepieces/ee-shared";


export const alertsApi = {
    list(request: ListAlertsParams): Promise<SeekPage<Alert>> {
        return api.get<SeekPage<Alert>>('/v1/alerts', request);
    }
}
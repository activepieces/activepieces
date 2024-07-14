import { api } from "@/lib/api";
import { ApFlagId } from "@activepieces/shared";


export const flagsApi = {
    getAll() {
        return api.get<Record<string, ApFlagId>>('/v1/flags');
    }
}
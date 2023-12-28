import { FlowRerunStrategy } from '@activepieces/shared';
import {
    environment,
} from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
@Injectable({
    providedIn: 'root',
})
export class RunsService {
    constructor(private http: HttpClient) { }

    rerun(runId: string, strategy: FlowRerunStrategy) {
        return this.http.post(
            environment.apiUrl + `/flow-runs/${runId}/rerun`, {}, {
                params: {
                    strategy
                }
            }
        );
    }
}


import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import { WorkerMachine } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class WorkersService {
  constructor(private http: HttpClient) {}
  list() {
    return this.http.get<WorkerMachine[]>(
      environment.apiUrl + '/worker-machines'
    );
  }
}

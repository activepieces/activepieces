import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateFolderRequest,
  FolderCreatedResponse,
  FoldersListDto,
  SeekPage,
} from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FoldersService {
  constructor(private http: HttpClient) {}
  create(req: CreateFolderRequest): Observable<FolderCreatedResponse> {
    return this.http.post<FolderCreatedResponse>(environment.apiUrl + '/folders', req);
  }
  list() {
    const params: Record<string, string | number> = {
      limit: 1000000,
    };
    return this.http.get<SeekPage<FoldersListDto>>(
      environment.apiUrl + '/folders',
      {
        params: params,
      }
    );
  }

  delete(folderId: string) {
    return this.http.delete<void>(environment.apiUrl + '/folders', {
      params: {
        folderId,
      },
    });
  }
}

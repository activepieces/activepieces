import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateFolderRequest, Folder, SeekPage } from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class FoldersService {
  constructor(private http: HttpClient) {}
  create(req: CreateFolderRequest) {
    return this.http.post<Folder>(environment.apiUrl + '/folders', req);
  }
  list() {
    const params: Record<string, string | number> = {
      limit: 10000000000,
    };
    return this.http.get<SeekPage<Folder>>(environment.apiUrl + '/folders', {
      params: params,
    });
  }
  delete(folderId: string) {
    return this.http.delete<void>(environment.apiUrl + '/folders', {
      params: {
        folderId,
      },
    });
  }
}

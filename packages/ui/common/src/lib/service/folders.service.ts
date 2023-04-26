import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateOrRenameFolderRequest,
  Folder,
  FolderDto,
  SeekPage,
} from '@activepieces/shared';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FoldersService {
  constructor(private http: HttpClient) {}

  create(req: CreateOrRenameFolderRequest): Observable<FolderDto> {
    return this.http.post<FolderDto>(environment.apiUrl + '/folders', req);
  }

  list() {
    const params: Record<string, string | number> = {
      limit: 1000000,
    };
    return this.http.get<SeekPage<FolderDto>>(environment.apiUrl + '/folders', {
      params: params,
    });
  }

  get(folderId: string): Observable<Folder> {
    return this.http.get<Folder>(environment.apiUrl + `/folders/${folderId}`);
  }

  delete(folderId: string) {
    return this.http.delete<void>(environment.apiUrl + `/folders/${folderId}`);
  }

  renameFolder(
    req: {
      folderId: string;
    } & CreateOrRenameFolderRequest
  ) {
    return this.http.post<Folder>(
      environment.apiUrl + `/folders/${req.folderId}`,
      { displayName: req.displayName }
    );
  }
}

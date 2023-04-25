import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateOrRenameFolderRequest,
  FolderDto,
  SeekPage,
} from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';
import { Observable } from 'rxjs';

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
    return this.http.get<SeekPage<FolderDto>>(
      environment.apiUrl + '/folders',
      {
        params: params,
      }
    );
  }

  delete(folderId: string) {
    return this.http.delete<void>(environment.apiUrl + `/folders/${folderId}`);
  }

  renameFolder(req:{
    folderId:string
  } & CreateOrRenameFolderRequest)
  {
    return this.http.post<void>(environment.apiUrl+`/folders/${req.folderId}`,{displayName:req.displayName});
  }
}


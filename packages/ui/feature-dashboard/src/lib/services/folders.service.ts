import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateOrRenameFolderRequest,
  Folder,
  FoldersListDto,
  SeekPage,
} from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FoldersService {
  constructor(private http: HttpClient) {}
  create(req: CreateOrRenameFolderRequest): Observable<FoldersListDto> {
    return this.http.post<Folder>(environment.apiUrl + '/folders', req).pipe(
      map((res) => {
        return {
          ...res,
          numberOfFlows: 0,
        };
      })
    );
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
    return this.http.delete<void>(environment.apiUrl + `/folders/${folderId}`);
  }

  renameFolder(req:{
    folderId:string
  } & CreateOrRenameFolderRequest)
  {
    return this.http.put<void>(environment.apiUrl+`/folders/${req.folderId}`,{displayName:req.displayName});
  }
}


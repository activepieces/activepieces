import { map, Observable, switchMap, take } from 'rxjs';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { AppConnectionsService } from '../service/app-connections.service';
import { ProjectSelectors } from '../store/project/project.selector';
import { AuthenticationService } from '../service';

export const connections$ = (
  store: Store,
  appConnectionsService: AppConnectionsService,
  authenticationService: AuthenticationService
): Observable<AppConnectionWithoutSensitiveData[]> => {
  return store.select(ProjectSelectors.selectCurrentProject).pipe(
    take(1),
    switchMap(() => {
      return appConnectionsService.list({
        limit: 999999,
        projectId: authenticationService.getProjectId(),
      });
    }),
    map((res) => {
      return res.data;
    })
  );
};

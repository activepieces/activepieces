import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap, map } from 'rxjs';
import { combineLatest } from 'rxjs';
import { CustomDomain } from '@activepieces/ee-shared';
import { CustomDomainService } from '../../service/custom-domain.service';

export class CustomDomainDataSource extends DataSource<CustomDomain> {
  data: CustomDomain[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private refresh$: Observable<boolean>,
    private customDomainService: CustomDomainService
  ) {
    super();
  }

  connect(): Observable<CustomDomain[]> {
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(([_refresh]) => {
        return this.customDomainService.list().pipe(map((res) => res.data));
      }),
      tap((res) => {
        this.data = res;
        this.isLoading$.next(false);
      })
    );
  }

  disconnect(): void {
    // no-op
  }
}

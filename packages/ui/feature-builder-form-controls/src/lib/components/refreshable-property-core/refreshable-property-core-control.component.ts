import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  DropdownProperty,
  DropdownState,
  DynamicProperties,
  MultiSelectDropdownProperty,
  PieceMetadataModel,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { UntypedFormGroup } from '@angular/forms';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import {
  AUTHENTICATION_PROPERTY_NAME,
  PopulatedFlow,
  spreadIfDefined,
} from '@activepieces/shared';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
  debounceTime,
} from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export class RefreshablePropertyCoreControlComponent {
  @Input({ required: true }) property:
    | DropdownProperty<unknown, boolean>
    | MultiSelectDropdownProperty<unknown, boolean>
    | DynamicProperties<boolean>;
  @Input({ required: true }) parentFormGroup: UntypedFormGroup;
  @Input({ required: true }) pieceMetaData: PieceMetadataModel;
  @Input({ required: true }) actionOrTriggerName: string;
  @Input({ required: true }) propertyName: string;
  @Input({ required: true }) flow: Pick<PopulatedFlow, 'id' | 'version'>;
  loading$ = new BehaviorSubject<boolean>(true);
  resetValueOnRefresherChange$?: Observable<unknown>;
  @Input({ required: true }) stepChanged$: Observable<string>;
  constructor(
    private piecetaDataService: PieceMetadataService,
    private searchRefresher$?: Observable<string>
  ) {}

  protected createRefreshers<
    T extends DropdownState<unknown> | PiecePropertyMap
  >(refreshDropdownOptions$?: Observable<void>) {
    this.resetValueOnRefresherChange$ = this.stepChanged$.pipe(
      tap(() => {
        this.loading$.next(true);
      }),
      switchMap(() => {
        return merge(...Object.values(this.getPropertyRefreshers(false))).pipe(
          tap(() => {
            this.refreshersChanged();
            this.loading$.next(true);
          })
        );
      })
    );
    const refreshers$: Observable<any> = this.stepChanged$.pipe(
      switchMap(() => {
        return combineLatest(this.getPropertyRefreshers(true)).pipe(
          startWith(this.parentFormGroup.value),
          debounceTime(300)
        );
      })
    );
    const search$ = this.getSearchRefresher();
    const singleTimeRefresher$ = of('singleTimeRefresher');
    const refresh$ = refreshDropdownOptions$
      ? refreshDropdownOptions$.pipe(
          tap(() => {
            this.loading$.next(true);
          })
        )
      : of('');
    return combineLatest({
      refreshers: refreshers$,
      search: search$,
      singleTimeRefresher: singleTimeRefresher$,
      refresh$: refresh$,
    }).pipe(
      switchMap((res) => {
        return this.piecetaDataService
          .getPieceActionConfigOptions<T>({
            flowId: this.flow.id,
            flowVersionId: this.flow.version.id,
            input: {
              ...res.refreshers,
            },
            packageType: this.pieceMetaData.packageType,
            pieceName: this.pieceMetaData.name,
            pieceType: this.pieceMetaData.pieceType,
            pieceVersion: this.pieceMetaData.version,
            propertyName: this.propertyName,
            stepName: this.actionOrTriggerName,
            searchValue: res.search,
          })
          .pipe(
            tap(() => {
              this.loading$.next(false);
            })
          );
      }),
      shareReplay(1)
    );
  }

  private getSearchRefresher() {
    return this.property.type === PropertyType.DROPDOWN &&
      this.property.refreshOnSearch &&
      this.searchRefresher$
      ? this.searchRefresher$.pipe(
          startWith(''),
          debounceTime(200),
          tap(() => {
            this.loading$.next(true);
          })
        )
      : of('');
  }

  private getPropertyRefreshers(
    startWithInitialValue: boolean
  ): Record<string, Observable<unknown>> {
    const refreshers =
      this.property.refreshers
        .map((refresherName) => {
          const control = this.parentFormGroup.get(refresherName);
          const refresh$ = control?.valueChanges;
          if (refresh$) {
            return {
              [refresherName]: startWithInitialValue
                ? refresh$.pipe(startWith(control.value))
                : refresh$,
            };
          } else {
            //this could happen when stepChanged$ emits before the inputs properties are changed
            console.warn(
              `Refreshable dropdown control: ${this.property.displayName} has a refresher ${refresherName} that does not exist in the form group`
            );
            return null;
          }
        })
        .filter((refresher$) => refresher$ !== null)
        .reduce((acc, curr) => {
          return { ...acc, ...curr };
        }, {}) ?? {};
    const authRefresher = this.parentFormGroup.get(
      AUTHENTICATION_PROPERTY_NAME
    )?.valueChanges;
    return {
      ...refreshers,
      ...spreadIfDefined(
        AUTHENTICATION_PROPERTY_NAME,
        startWithInitialValue
          ? authRefresher?.pipe(
              startWith(
                this.parentFormGroup.get(AUTHENTICATION_PROPERTY_NAME)?.value
              )
            )
          : authRefresher
      ),
    };
  }

  protected refreshersChanged() {
    console.error('refreshersChanged not implemented');
  }
}

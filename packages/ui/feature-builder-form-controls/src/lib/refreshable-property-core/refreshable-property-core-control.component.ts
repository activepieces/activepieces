import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PieceMetadataModel } from '@activepieces/ui/common';
import {
  DropdownProperty,
  DropdownState,
  MultiSelectDropdownProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import {
  AUTHENTICATION_PROPERTY_NAME,
  PopulatedFlow,
} from '@activepieces/shared';
import {
  Observable,
  combineLatest,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export class RefreshablePropertyCoreControlComponent {
  @Input({ required: true }) passedFormControl: UntypedFormControl;
  @Input({ required: true }) property:
    | DropdownProperty<unknown, boolean>
    | MultiSelectDropdownProperty<unknown, boolean>;
  @Input({ required: true }) parentFormGroup: UntypedFormGroup;
  @Input({ required: true }) pieceMetaData: PieceMetadataModel;
  @Input({ required: true }) stepName: string;
  @Input({ required: true }) propertyName: string;
  @Input({ required: true }) flow: Pick<PopulatedFlow, 'id' | 'version'>;

  constructor(
    private piecetaDataService: PieceMetadataService,
    private searchRefresher$?: Observable<string>
  ) {}

  protected createRefreshers<
    T extends DropdownState<unknown> | PiecePropertyMap
  >() {
    const auth$ = this.getAuthRefresher();

    const refreshers$: Record<
      string,
      Observable<unknown>
    > = this.getPropertyRefreshers();

    const search$ = this.getSerchRefresher();

    const singleTimeRefresher$ = of('singleTimeRefresher');
    return combineLatest({
      auth: auth$,
      refreshers: combineLatest({ ...refreshers$ }),
      search: search$,
      singleTimeRefresher: singleTimeRefresher$,
    }).pipe(
      switchMap((res) => {
        return this.piecetaDataService.getPieceActionConfigOptions<T>({
          flowId: this.flow.id,
          flowVersionId: this.flow.version.id,
          input: res.refreshers,
          packageType: this.pieceMetaData.packageType,
          pieceName: this.pieceMetaData.name,
          pieceType: this.pieceMetaData.pieceType,
          pieceVersion: this.pieceMetaData.version,
          propertyName: this.propertyName,
          stepName: this.stepName,
          searchValue: res.search,
        });
      }),
      shareReplay(1)
    );
  }

  private getSerchRefresher() {
    return this.property.type === PropertyType.DROPDOWN &&
      this.property.refreshOnSearch &&
      this.searchRefresher$
      ? this.searchRefresher$
      : of('');
  }

  private getPropertyRefreshers(): Record<string, Observable<unknown>> {
    return (
      this.property.refreshers
        .map((refresherName) => {
          const control = this.parentFormGroup.get(refresherName);
          const refresh$ = control?.valueChanges.pipe(startWith(control.value));
          if (refresh$) {
            return {
              [refresherName]: refresh$,
            };
          } else {
            console.error(
              `Refreshable dropdown control: ${this.property.displayName} has a refresher ${refresherName} that does not exist in the form group`
            );
            return null;
          }
        })
        .filter((refresher$) => refresher$ !== null)
        .reduce((acc, curr) => {
          return { ...acc, ...curr };
        }, {}) ?? {}
    );
  }

  private getAuthRefresher() {
    const authControler = this.parentFormGroup.get(
      AUTHENTICATION_PROPERTY_NAME
    );
    const auth$ =
      authControler
        ?.get(AUTHENTICATION_PROPERTY_NAME)
        ?.valueChanges.pipe(startWith(authControler.value)) ?? of(undefined);
    return auth$;
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TelemetryService } from '@activepieces/ui/common';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';
import {
  Observable,
  debounceTime,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { TriggerType } from '@activepieces/shared';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
  PieceMetadataService,
  corePieceIconUrl,
} from '@activepieces/ui/feature-pieces';

@Component({
  selector: 'app-template-apps-dropdown',
  templateUrl: './template-apps-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TemplateAppsDropdownComponent,
    },
  ],
})
export class TemplateAppsDropdownComponent implements ControlValueAccessor {
  //EE
  savePiecesSearch$: Observable<void>;
  //EE End
  pieces$: Observable<
    Pick<PieceMetadataSummary, 'displayName' | 'logoUrl' | 'name'>[]
  >;
  filteredBySearchPieces$: Observable<
    Pick<PieceMetadataSummary, 'displayName' | 'logoUrl' | 'name'>[]
  >;
  piecesToShowInDropdown$: Observable<
    Pick<PieceMetadataSummary, 'displayName' | 'logoUrl' | 'name'>[]
  >;
  selectedPieces: string[] = [];
  dropdownControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  valueChanges$: Observable<string>;
  searchControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  onChange: (val: Array<string>) => void = () => {
    //ignored
  };

  constructor(
    private pieceMetadataService: PieceMetadataService,
    //EE
    private telemetryService: TelemetryService
  ) {
    this.savePiecesSearch$ = this.searchControl.valueChanges.pipe(
      debounceTime(1000),
      switchMap((search) => {
        return this.telemetryService.savePiecesSearch({
          insideTemplates: true,
          search,
          target: 'both',
        });
      }),
      map(() => void 0)
    );
    //EE End

    this.valueChanges$ = this.dropdownControl.valueChanges.pipe(
      tap((val) => {
        this.addPieceToFilter(val);
        this.dropdownControl.setValue('', { emitEvent: false });
      })
    );

    this.fetchPieces();

    this.filteredBySearchPieces$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      switchMap((search) => {
        return this.pieces$.pipe(
          map((pieces) => {
            return pieces.filter((p) => {
              return (
                p.displayName
                  .toLowerCase()
                  .includes(search.toLocaleLowerCase()) &&
                !this.selectedPieces.includes(p.name)
              );
            });
          })
        );
      })
    );

    this.setPiecesToShowInDropdown();
  }
  private fetchPieces() {
    this.pieces$ = this.pieceMetadataService.getPiecesManifest().pipe(
      map((pieces) => {
        const coreSteps = [
          ...this.pieceMetadataService.triggerItemsDetails.filter(
            (d) => d.type !== TriggerType.EMPTY
          ),
          ...this.pieceMetadataService.coreFlowItemsDetails,
        ].map((detail) => {
          const nonePieceDetials =
            this.pieceMetadataService.findNonPieceStepIcon(detail.type);
          return {
            displayName: detail.name,
            logoUrl: nonePieceDetials.url,
            name: nonePieceDetials.key,
          };
        });
        const result = [
          ...coreSteps,
          ...pieces.map((p) => {
            if (
              CORE_PIECES_ACTIONS_NAMES.find((n) => p.name === n) ||
              CORE_PIECES_TRIGGERS.find((n) => p.name === n)
            ) {
              return {
                ...p,
                logoUrl: corePieceIconUrl(p.name),
              };
            }
            return p;
          }),
        ];
        // sort result by display name
        result.sort((a, b) => {
          return a.displayName.localeCompare(b.displayName) > -1 ? 1 : -1;
        });
        return result;
      }),
      shareReplay(1)
    );
  }

  writeValue(): void {
    //ignored
  }
  registerOnChange(fn: (val: Array<string>) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(): void {
    //ignored
  }
  setDisabledState?(): void {
    //ignored
  }
  addPieceToFilter(pieceName: string) {
    this.selectedPieces.push(pieceName);
    this.searchControl.setValue('');
    this.dropdownControl.setValue('', { emitEvent: false });
    this.setPiecesToShowInDropdown();
    this.onChange(this.selectedPieces);
  }
  removePieceFromFilter(pieceName: string) {
    this.selectedPieces = this.selectedPieces.filter((p) => p !== pieceName);
    this.setPiecesToShowInDropdown();
    this.onChange(this.selectedPieces);
  }

  private setPiecesToShowInDropdown() {
    this.piecesToShowInDropdown$ = this.pieces$.pipe(
      map((pieces) => {
        return pieces.filter((p) => !this.selectedPieces.includes(p.name));
      })
    );
  }
}

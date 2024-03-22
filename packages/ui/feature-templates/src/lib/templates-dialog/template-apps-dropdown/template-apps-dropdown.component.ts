import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TelemetryService } from '@activepieces/ui/common';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';
import { Observable, debounceTime, map, startWith, switchMap, tap } from 'rxjs';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

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
  savePiecesSearch$: Observable<void>;
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
    private telemetryService: TelemetryService,
    private pieceMetadataService: PieceMetadataService
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

    this.valueChanges$ = this.dropdownControl.valueChanges.pipe(
      tap((val) => {
        this.addPieceToFilter(val);
        this.dropdownControl.setValue('', { emitEvent: false });
      })
    );
    this.pieces$ = this.pieceMetadataService.listPieces({});

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

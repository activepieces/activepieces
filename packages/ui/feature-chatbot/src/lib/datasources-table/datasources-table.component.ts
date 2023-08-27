import { Component, Input } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { DatasourceType } from '../utils';
import { MatDialog } from '@angular/material/dialog';
import { ChatbotDataSourceDialogComponent } from '../chatbot-source-dialog/chatbot-source-dialog.component';
import { Observable, map, of, tap } from 'rxjs';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';

export type DataSourceValue = {
  type: DatasourceType;
  url: string;
  status: 'Pending' | 'Active' | 'Failed';
};

@Component({
  selector: 'app-datasources-table',
  templateUrl: './datasources-table.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: DatasourcesTableComponent,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: DatasourcesTableComponent,
      multi: true,
    },
  ],
})
export class DatasourcesTableComponent implements ControlValueAccessor {
  value: DataSourceValue[] = [];
  addNewDataSource$: Observable<void> | undefined;
  @Input() chatbotId = '';
  constructor(private matDialog: MatDialog) {}
  onChange: (val: DataSourceValue[]) => void = () => void 0;
  writeValue(obj: DataSourceValue[]): void {
    this.value = obj;
  }
  registerOnChange(fn: (val: DataSourceValue[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(): void {
    //ignore
  }
  setDisabledState?(): void {
    //ignore
  }
  newSource() {
    this.addNewDataSource$ = this.matDialog
      .open(ChatbotDataSourceDialogComponent)
      .afterClosed()
      .pipe(
        tap((val: DataSourceValue) => {
          if (val) {
            this.value = [...this.value, val];
            this.onChange(this.value);
          }
        }),
        map(() => void 0)
      );
  }
  deleteSource(val: DataSourceValue) {
    const data: DeleteEntityDialogData = {
      deleteEntity$: of(null).pipe(
        tap(() => {
          const idx = this.value.findIndex((v) => val.url === val.url);
          this.value.splice(idx, 1);
          this.onChange(this.value);
        })
      ),
      entityName: 'source',
      note: `Are you sure you want to delete this "${val.url}" source?
      This action cannot be undone`,
    };
    this.matDialog.open(DeleteEntityDialogComponent, { data: data });
  }
  validate() {
    if (this.value.length === 0) {
      return { invalid: true };
    }
    return null;
  }
}

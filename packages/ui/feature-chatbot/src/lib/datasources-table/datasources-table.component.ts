import { Component } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-datasources-table',
  templateUrl: './datasources-table.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: DatasourcesTableComponent,
    },
  ],
})
export class DatasourcesTableComponent implements ControlValueAccessor {}

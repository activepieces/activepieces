import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  AddDataSourceDialogData,
  ChatbotDataSourceDialogComponent,
} from '../chatbot-source-dialog/chatbot-source-dialog.component';
import { Observable, map, tap } from 'rxjs';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';
import { Chatbot, DataSource } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChatBotService } from '../chatbot.service';

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
export class DatasourcesTableComponent implements ControlValueAccessor {
  value: DataSource[] = [];
  overflowns: Record<string, string> = {};
  addNewDataSource$: Observable<void> | undefined;
  @Input() chatbotId = '';
  @Input() saving = false;
  @Input() auth = '';
  constructor(
    private matDialog: MatDialog,
    private snackbar: MatSnackBar,
    private chatbotService: ChatBotService,
    private cd: ChangeDetectorRef
  ) {}
  onChange: (val: DataSource[]) => void = () => void 0;
  writeValue(obj: DataSource[]): void {
    this.value = obj;
  }
  registerOnChange(fn: (val: DataSource[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(): void {
    //ignore
  }
  setDisabledState?(): void {
    //ignore
  }
  newSource() {
    if (this.auth) {
      const data: AddDataSourceDialogData = {
        chatbotId: this.chatbotId,
      };
      this.addNewDataSource$ = this.matDialog
        .open(ChatbotDataSourceDialogComponent, { data: data })
        .afterClosed()
        .pipe(
          tap((val: Chatbot) => {
            if (val) {
              this.value = [...val.dataSources];
              this.onChange(this.value);
            }
          }),
          map(() => void 0)
        );
    } else {
      this.snackbar.open('Please choose an OpenAI connection first');
    }
  }
  deleteSource(val: DataSource) {
    const data: DeleteEntityDialogData = {
      deleteEntity$: this.chatbotService
        .deleteDataSource({
          chatbotId: this.chatbotId,
          dataSourceId: val.id,
        })
        .pipe(
          tap((val: Chatbot) => {
            if (val) {
              this.value = [...val.dataSources];
              this.onChange(this.value);
            }
            this.cd.markForCheck();
          }),
          map(() => void 0)
        ),
      entityName: 'source',
      note: `Are you sure you want to delete ${val.displayName}?
      This action cannot be undone`,
    };
    this.matDialog.open(DeleteEntityDialogComponent, { data: data });
  }
}

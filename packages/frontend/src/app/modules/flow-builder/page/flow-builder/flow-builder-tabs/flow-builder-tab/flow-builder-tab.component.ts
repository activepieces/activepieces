import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { FlowsActions } from '../../../../store/flow/flows.action';

import {
  ChevronDropdownOption,
  ChevronDropdownOptionType,
} from '../../../../components/chevron-dropdown-menu/chevron-dropdown-option';
import { DeleteFlowDialogComponent } from './delete-flow-dialog/delete-flow-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Flow } from '@activepieces/shared';

@Component({
  selector: 'app-flow-builder-tab',
  templateUrl: './flow-builder-tab.component.html',
  styleUrls: ['./flow-builder-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowBuilderTabComponent {
  flowActions: ChevronDropdownOption[];
  _flow: Flow;

  @Input() set flow(_flow: Flow) {
    this._flow = _flow;
    this.flowActions = [
      {
        id: 'RENAME',
        name: 'Rename',
        type: ChevronDropdownOptionType.NORMAL,
        cssClasses: '',
      },
      {
        id: 'DELETE',
        name: 'Delete',
        type: ChevronDropdownOptionType.NORMAL,
        cssClasses: 'text-danger',
      },
      {
        id: 'SEP_1',
        type: ChevronDropdownOptionType.SEPARATOR,
        cssClasses: '',
      },
      {
        id: 'ID',
        name: _flow.id.toString(),
        type: ChevronDropdownOptionType.COPY_ID,
        cssClasses: '',
      },
    ];
  }

  get flow(): Flow {
    return this._flow;
  }

  @Input() tabSelected: boolean;
  @Input() parentToflowPopUp: HTMLElement;
  @Input() readonlyMode: boolean;
  @Output() switchToFlow: EventEmitter<boolean> = new EventEmitter();
  dropDownOpened = false;
  editing = false;
  hovered = false;

  constructor(private store: Store, private dialogService: MatDialog) {}

  actionHandler(actionId: string) {
    if (actionId === 'RENAME') {
      this.editing = true;
    } else if (actionId === 'DELETE') {
      this.dialogService.open(DeleteFlowDialogComponent, {
        data: { ...this._flow },
      });
    }
  }

  saveNewName(newName: string) {
    if (this.flow.version?.displayName == newName) {
      this.revertNewName();
    } else {
      this.dispatchNewName(newName);
    }
  }

  private dispatchNewName(newName: string) {
    this.store.dispatch(
      FlowsActions.changeName({
        flowId: this.flow.id,
        displayName: newName,
      })
    );
  }

  private revertNewName() {
    this.store.dispatch(
      FlowsActions.changeName({
        flowId: this.flow.id,
        displayName: this.flow.version!.displayName,
      })
    );
  }

  handleHovering(isOnContainer: boolean) {
    this.hovered = isOnContainer;
  }

  containerClicked() {
    setTimeout(() => {
      if (!this.dropDownOpened && !this.tabSelected) {
        this.switchToFlow.emit(true);
      }
    }, 10);
  }
}

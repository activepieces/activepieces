import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { faCaretDown, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import {
  ChevronDropdownOption,
  ChevronDropdownOptionType,
} from './chevron-dropdown-option';

@Component({
  selector: 'app-chevron-dropdown-menu',
  templateUrl: './chevron-dropdown-menu.component.html',
  styleUrls: ['./chevron-dropdown-menu.component.scss'],
})
export class ChevronDropdownMenuComponent {
  @Input() data: ChevronDropdownOption[];
  @Input() useChevron = false;
  @Output() selectValueChange: EventEmitter<string> =
    new EventEmitter<string>();
  @Output() dropDownOpenedChanged: EventEmitter<boolean> = new EventEmitter();
  @Input() appendToBody: boolean;
  @Input() elementPopupsAreRelativeTo: HTMLElement;
  @Input() IdEntityName = '';
  faCaretDown = faCaretDown;
  faChevronDown = faChevronDown;
  constructor(private snackbar: MatSnackBar) {}

  emitAction(id: string) {
    this.selectValueChange.emit(id);
  }

  dropdownOpenStateChanged(opened: boolean) {
    this.dropDownOpenedChanged.emit(opened);
  }

  get itemType() {
    return ChevronDropdownOptionType;
  }

  copyId(option: ChevronDropdownOption) {
    this.snackbar.open(`${this.IdEntityName} ID copied to clipboard`);
    navigator.clipboard.writeText(option.name!);
  }
}

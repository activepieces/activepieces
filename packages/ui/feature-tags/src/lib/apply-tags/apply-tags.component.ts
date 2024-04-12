import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationService, UiCommonModule } from '@activepieces/ui/common';
import { Observable, map, tap } from 'rxjs';
import { Tag } from '@activepieces/shared';
import { TagsService } from '../tags.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { CreateTagDialogComponent } from '../create-tag-dialog/create-tag-dialog.component';

@Component({
  selector: 'ap-apply-tags',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  templateUrl: './apply-tags.component.html',
})
export class ApplyTagsComponent {

  @Input({ required: true }) tagSelection!: SelectionModel<string>;
  @Output() applyTags = new EventEmitter<string[]>();
  @Input({ required: true }) mixedTags!: string[]

  changedTags: Set<string>;
  tags$: Observable<Tag[]>;
  openDialog$: Observable<void> | undefined;

  constructor(private tagsService: TagsService, private authenticationService: AuthenticationService, private matDialog: MatDialog) {
    this.tags$ = this.tagsService.list({ limit: 1000, platformId: this.authenticationService.getPlatformId()! }).pipe(map(page => page.data));
    this.changedTags = new Set();
  }

  toggle(label: string) {
    this.changedTags.add(label);
    if (this.tagSelection.isSelected(label)) {
      this.tagSelection.deselect(label);
    } else {
      this.tagSelection.select(label);
    }
  }

  isMixed(label: string): boolean {
    return this.mixedTags.includes(label);
  }

  menuClosed() {
    if (this.changedTags.size === 0) {
      return;
    }
    this.applyTags.emit(Array.from(this.changedTags));
    this.clearTags();
  }

  createTag() {
    const dialog = this.matDialog.open(CreateTagDialogComponent);
    this.openDialog$ = dialog.afterClosed().pipe(
      tap(() => {
        this.tags$ = this.tagsService.list({ limit: 1000, platformId: this.authenticationService.getPlatformId()! }).pipe(map(page => page.data))
      })
    )
  }

  clearTags() {
    this.changedTags.clear();
  }
}

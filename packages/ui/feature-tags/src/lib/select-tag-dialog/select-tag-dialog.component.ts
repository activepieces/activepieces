import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SeekPage, Tag } from '@activepieces/shared';
import { TagsService } from '../tags.service';

@Component({
  selector: 'lib-select-tag-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-tag-dialog.component.html',
})
export class SelectTagDialogComponent implements OnInit{

  tags$: Observable<SeekPage<Tag>>;

  constructor(private tagService: TagsService) { }
  
  ngOnInit(): void {
    this.tags$ = this.tagService.list({ limit: 10 });
  }
}

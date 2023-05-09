import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { PromptTemplate } from '../prompt-templates';
import { Observable } from 'rxjs';
import { PromptsService } from '../services/prompts.service';

@Component({
  selector: 'app-prompts-table',
  templateUrl: './prompts-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptsTableComponent {
  @Output()
  promptClicked = new EventEmitter<string>();
  prompts$: Observable<PromptTemplate[]>;
  constructor(private promptsService: PromptsService) {
    this.prompts$ = this.promptsService.getPrompts();
  }
}

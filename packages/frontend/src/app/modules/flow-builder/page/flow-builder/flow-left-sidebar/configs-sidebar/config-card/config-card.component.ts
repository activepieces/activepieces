import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Config } from '@activepieces/shared';
import { ThemeService } from '../../../../../../common/service/theme.service';

@Component({
  selector: 'app-variable-content',
  templateUrl: './config-card.component.html',
  styleUrls: ['./config-card.component.scss'],
})
export class ConfigCardComponent {
  @Output() deleteEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() variable: Config;
  @Input() viewMode: boolean;

  constructor(public themeService: ThemeService) {}
}

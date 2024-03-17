import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceMarkdownConsts',
  standalone: true,
  pure: true,
})
export class ReplaceMarkdownConstsPipe implements PipeTransform {
  transform(
    value: string,
    flowId: string,
    webhookPrefix: string,
    formPieceTriggerPrefix: string
  ): string {
    return value
      .replace('{{webhookUrl}}', `${webhookPrefix}/${flowId}`)
      .replace('{{formUrl}}', `${formPieceTriggerPrefix}/${flowId}`);
  }
}

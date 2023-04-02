import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from './components/markdown/markdown.component';
import { MarkdownModule, MarkedOptions, MarkedRenderer } from 'ngx-markdown';


export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();
  const linkRenderer = renderer.link;

  renderer.link = (href, title, text) => {
    const html = linkRenderer.call(renderer, href, title, text);
    return html.replace(
      /^<a /,
      '<a role="link" tabindex="0" target="_blank" rel="nofollow noopener noreferrer" '
    );
  };

  return {
    renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
    smartLists: true,
    smartypants: false,
  };
}
@NgModule({
  imports: [CommonModule, MarkdownModule.forRoot({
    markedOptions: {
      provide: MarkedOptions,
      useFactory: markedOptionsFactory,
    },
  }),],
  declarations: [MarkdownComponent],
  exports: [MarkdownComponent],
})
export class UiCommonModule { }

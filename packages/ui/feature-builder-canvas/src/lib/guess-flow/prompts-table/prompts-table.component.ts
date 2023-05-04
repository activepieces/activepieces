import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-prompts-table',
  templateUrl: './prompts-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptsTableComponent {

  prompts:{
    content:string,
    urls:string[];
    more:number
  }[]=[
    {
      urls:['https://cdn.activepieces.com/pieces/figma.png', 'https://cdn.activepieces.com/pieces/asana.png', 'https://cdn.activepieces.com/pieces/bannerbear.png'],
      content:'Hugging Face + Zapier: Create personalized email content for customers based on their behavior and preferences.',
      more:3
    },
    {
      urls:['https://cdn.activepieces.com/pieces/figma.png', 'https://cdn.activepieces.com/pieces/bannerbear.png'],
      content:'Hugging Face + Zapier: Create personalized email content for customers based on their behavior and preferences.',
      more:0
    },
    {
      urls:['https://cdn.activepieces.com/pieces/figma.png'],
      content:'Hugging Face + Zapier: Create personalized email content for customers based on their behavior and preferences.',
      more:3
    }
  ];

}

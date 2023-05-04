import { ChangeDetectionStrategy,  Component } from '@angular/core';

@Component({
  selector: 'app-guess-flow',
  templateUrl: './guess-flow.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuessFlowComponent {
  guess={value:''};
  guessStyling = {'line-height':'68px', 'font-size':'50px', 'font-weight':'600'};
  stylingLimits ={
    oneLine:{
      'line-height':'68px',
      'font-size':'50px',
      'font-weight':'600'
    },
    twoLines :
    {
      'line-height':'41px',
      'font-size':'30px',
      'font-weight':'600'
    },
    moreThanTwoLines:
    {
      'line-height':'27px',
      'font-size':'20px',
      'font-weight':'400'
    }
  }
  changeGuessValue(htmlDiv:HTMLElement)
  {
    this.guess = {value:htmlDiv.textContent || ''};
    // this.calculateInputStyle(htmlDiv);
  }
  paste($event:ClipboardEvent,target:HTMLElement)
  {
    //Disallow HTML pasting
    $event.preventDefault();
    const clipboard = $event.clipboardData?.getData("text");
    this.guess = clipboard ?{value:clipboard} : {value:''};
    target.textContent=clipboard || null;
    // this.calculateInputStyle(target);
  }

  calculateInputStyle(htmlDiv:HTMLElement)
  {
    var divHeight = htmlDiv.offsetHeight
    var lineHeight = parseInt(htmlDiv.style.lineHeight);
    var lines = divHeight / lineHeight;
    switch(lines)
    {
      case 1:
       { this.guessStyling = this.stylingLimits.oneLine;
        break;
       }
       case 1:
        { this.guessStyling = this.stylingLimits.twoLines;
         break;
        }
        default:
          this.guessStyling = this.stylingLimits.moreThanTwoLines
    }
  }

}

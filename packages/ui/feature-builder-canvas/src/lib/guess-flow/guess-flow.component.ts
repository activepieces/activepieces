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
    this.calculateInputStyle();
  }
  paste($event:ClipboardEvent,target:HTMLElement)
  {
    //Disallow HTML pasting
    $event.preventDefault();
    const clipboard = $event.clipboardData?.getData("text");
    this.guess = clipboard ?{value:clipboard} : {value:''};
    target.textContent=clipboard || null;
    this.calculateInputStyle();
  }

  calculateInputStyle()
  {
    if(this.guess.value.length <=38)
    {
      this.guessStyling = this.stylingLimits.oneLine;
    }
    else if(this.guess.value.length > 38 && this.guess.value.length < 76 )
    {
      this.guessStyling = this.stylingLimits.twoLines;
    }
    else
    {
      this.guessStyling = this.stylingLimits.moreThanTwoLines
    }
  }

}

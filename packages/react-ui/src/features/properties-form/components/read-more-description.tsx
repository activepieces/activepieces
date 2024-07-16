import { useState } from 'react';

interface ReadMoreProps {
  text: string;
  amountOfWords?: number;
}

export const ReadMoreDescription = ({
  text,
  amountOfWords = 10,
}: ReadMoreProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const splittedText = text.split(' ');
  const itCanOverflow = splittedText.length > amountOfWords;
  const beginText = itCanOverflow
    ? splittedText.slice(0, amountOfWords - 1).join(' ')
    : text;
  const endText = splittedText.slice(amountOfWords - 1).join(' ');

  const handleKeyboard = (e: { code: string }) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <p className="text-muted-foreground text-xs whitespace-pre-wrap	">
      {beginText}
      {itCanOverflow && (
        <>
          {!isExpanded && <span>... </span>}
          <span
            className={`${!isExpanded && 'hidden'} whitespace-pre-wrap	`}
            aria-hidden={!isExpanded}
          >
            {endText}
          </span>
          <span
            className="text-primary ml-2"
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            onKeyDown={handleKeyboard}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'show less' : 'show more'}
          </span>
        </>
      )}
    </p>
  );
};

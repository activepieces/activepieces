import { useState } from 'react';

interface ReadMoreProps {
  text: string;
  amountOfCharacters?: number;
}

export const ReadMoreDescription = ({
  text,
  amountOfCharacters = 80,
}: ReadMoreProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itCanOverflow = text.length > amountOfCharacters;
  const beginText = itCanOverflow ? text.slice(0, amountOfCharacters) : text;
  const endText = text.slice(amountOfCharacters);

  const handleKeyboard = (e: { code: string }) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <p className="text-muted-foreground text-xs whitespace-pre-wrap">
      {beginText}
      {itCanOverflow && (
        <>
          {!isExpanded && <span>... </span>}
          <span
            className={`${!isExpanded && 'hidden'} whitespace-pre-wrap`}
            aria-hidden={!isExpanded}
          >
            {endText}
          </span>
          <span
            className="text-primary ml-2 cursor-pointer"
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

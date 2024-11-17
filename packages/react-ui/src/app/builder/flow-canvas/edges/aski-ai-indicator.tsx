import { Sparkles } from 'lucide-react';

const AskAiIndicator = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  return (
    <div
      style={{
        width: width + 'px',
        height: height + 'px',
      }}
      className="transition-all animate-ask-ai-background bg-[length:400%] shadow-add-button bg-gradient-to-r  from-primary/90  via-primary/55 to-primary/90 flex items-center  justify-center  rounded-xss"
    >
      <Sparkles
        className="stroke-background/80  "
        style={{
          height: `${height * 0.75}px`,
          width: `${width * 0.75}px`,
        }}
      ></Sparkles>
    </div>
  );
};
AskAiIndicator.displayName = 'AskAiIndicator';
export { AskAiIndicator };

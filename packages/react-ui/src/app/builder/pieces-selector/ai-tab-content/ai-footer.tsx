import React from 'react';

const AITabFooter = () => {
  return (
    <div className="py-3 flex items-center gap-2.5 px-4 bg-white dark:bg-zinc-950">
      <span className="text-[13.5px] text-zinc-400 dark:text-zinc-500">
        Available models:
      </span>
      <div className="flex items-center gap-3">
        <img
          src="https://cdn.activepieces.com/pieces/google-gemini.png"
          alt="Gemini"
          className="w-[20px] h-[20px] shrink-0"
        />
        <img
          src="https://cdn.activepieces.com/pieces/openai.png"
          alt="OpenAI"
          className="w-[20px] h-[20px] shrink-0"
        />
        <img
          src="https://cdn.activepieces.com/pieces/claude.png"
          alt="Anthropic"
          className="w-[20px] h-[20px] shrink-0"
        />
        <span className="text-[13.5px] text-zinc-400 dark:text-zinc-500 -ml-1">
          + more
        </span>
      </div>
    </div>
  );
};

export default AITabFooter;

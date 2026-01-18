export const AIActionsFooter = () => {
  return (
    <div className="flex items-center gap-3 pt-3 border-t border-border shrink-0">
      <span className="text-sm text-muted-foreground">Available Models:</span>
      <div className="flex items-center gap-2">
        <img
          src="https://cdn.activepieces.com/pieces/google-gemini.png"
          alt="Gemini"
          className="w-6 h-6 rounded"
        />
        <img
          src="https://cdn.activepieces.com/pieces/openai.png"
          alt="GPT"
          className="w-6 h-6 rounded"
        />
        <img
          src="https://cdn.activepieces.com/pieces/claude.png"
          alt="Claude"
          className="w-6 h-6 rounded"
        />
        <span className="text-sm text-muted-foreground">+more</span>
      </div>
    </div>
  );
};

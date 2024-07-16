import ReactMarkdown from 'react-markdown';

type MarkdownProps = {
  markdown: string | undefined;
  className?: string;
};

export const ApMarkdown = ({ markdown }: MarkdownProps) => {
  if (!markdown) {
    return null;
  }
  return (
    <ReactMarkdown
      components={{
        h1: ({ node, ...props }) => (
          <h1
            className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
            {...props}
          />
        ),
        h2: ({ node, ...props }) => (
          <h2
            className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
            {...props}
          />
        ),
        h3: ({ node, ...props }) => (
          <h3
            className="scroll-m-20 text-2xl font-semibold tracking-tight"
            {...props}
          />
        ),
        p: ({ node, ...props }) => (
          <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
        ),
        li: ({ node, ...props }) => <li {...props} />,
        a: ({ node, ...props }) => (
          <a
            className="font-medium text-primary underline underline-offset-4"
            {...props}
          />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />
        ),
      }}
    >
      {markdown.replaceAll('<br>', '\n')}
    </ReactMarkdown>
  );
};

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';

const StreamMarkdown = ({
  content,
  showStreamText = true,
}: {
  content: string;
  showStreamText?: boolean;
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showStreamText) {
      setDisplayedContent(content);
      return;
    }
    let index = 0;
    const interval = setInterval(() => {
      if (index < content.length - 1) {
        if (index == 0) {
          setDisplayedContent(content[index]);
        }
        setDisplayedContent((prev) => prev + content[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 10);
    return () => clearInterval(interval);
  }, [content, showStreamText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedContent]);

  return (
    <div>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="font-semibold text-[16px] leading-[26.25px] tracking-[0%] align-middle text-[#202020]"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="font-semibold text-[15px] leading-[26.25px] tracking-[0%] align-middle text-[#202020]"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="scroll-m-20 text-lg font-semibold tracking-tight"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className="font-inter font-normal text-[14px] leading-[26.25px] tracking-[0%] align-middle text-[#202020]"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="mt-4 ml-6 list-disc [&>li]:mt-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mt-4 ml-6 list-decimal [&>li]:mt-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li
              className="font-inter font-normal text-[14px] leading-[26.25px] tracking-[0%] align-middle text-[#202020]"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="font-medium text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer noopener"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="mt-4 first:mt-0 border-l-2 pl-6 italic"
              {...props}
            />
          ),
          b: ({ node, ...props }) => <b {...props} />,
          em: ({ node, ...props }) => <em {...props} />,
        }}
        children={displayedContent}
        remarkPlugins={[remarkMath]}
      />
      <div ref={bottomRef} />
    </div>
  );
};

export default StreamMarkdown;

import { RefObject, useEffect, useRef } from 'react';
import { useStickToBottomContext } from 'use-stick-to-bottom';

export function MatchScrollGutter({
  footerRef,
}: {
  footerRef: RefObject<HTMLDivElement | null>;
}) {
  const { scrollRef } = useStickToBottomContext();
  useEffect(() => {
    const scroller = scrollRef.current;
    const footer = footerRef.current;
    if (!scroller || !footer) return;
    const measure = () =>
      footer.style.setProperty(
        GUTTER_PROPERTY,
        `${scroller.offsetWidth - scroller.clientWidth}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => {
      observer.disconnect();
      footer.style.removeProperty(GUTTER_PROPERTY);
    };
  }, [scrollRef, footerRef]);
  return null;
}

export function KeepBottomOnFooterGrowth({
  footerRef,
}: {
  footerRef: RefObject<HTMLDivElement | null>;
}) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const atBottomRef = useRef(isAtBottom);
  useEffect(() => {
    atBottomRef.current = isAtBottom;
  }, [isAtBottom]);
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    let height = footer.offsetHeight;
    const observer = new ResizeObserver(() => {
      const next = footer.offsetHeight;
      if (next > height && atBottomRef.current) {
        Promise.resolve(scrollToBottom('instant')).catch(() => undefined);
      }
      height = next;
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, [footerRef, scrollToBottom]);
  return null;
}

const GUTTER_PROPERTY = '--chat-scroll-gutter';

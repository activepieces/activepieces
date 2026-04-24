import { t } from 'i18next';
import { Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';

import { cn } from '@/lib/utils';

function pickRandomIndex(current: number, length: number): number {
    let next = Math.floor(Math.random() * (length - 1));
    if (next >= current) next++;
    return next;
}

const MESSAGES = [
    'Hold on, thinking real hard 🧠',
    'Hmm let me figure this out 🤔',
    'Cooking something up for you 🍳',
    'Brb, talking to the robots 🤖',
    'Give me a sec, almost there ⏳',
    'No rush... ok maybe a little rush 😅',
    'Connecting all the dots 🔗',
    'My brain is warming up ☕',
    'One moment, doing robot stuff 🦾',
    'Let me ask my robot friends 🤝',
    'Hang tight, magic in progress ✨',
    'Putting the puzzle pieces together 🧩',
    'Almost got it, just one more thing 👀',
    'Thinking... thinking... still thinking 💭',
    'Making your flow extra nice 💅',
    'On it! Be right back 🏃',
    'Grabbing the right tools 🔧',
    'Crunching some numbers real quick 🔢',
    'Let me check my notes 📝',
    'Working behind the scenes 🎬',
    'Doing the heavy lifting for you 💪',
    'Getting everything ready 🎯',
    'Okay okay, I\'m on it 🫡',
    'Bear with me, good things take a sec 🐻',
    'Setting things up, won\'t be long 🛠️',
    'Let me think about this one 🧐',
    'Running through some ideas 💡',
    'Almost ready, just dotting the i\'s ✍️',
    'Doing my best work here 🎨',
    'Hold tight, something cool is coming 🚀',
    'Working my magic 🪄',
    'Just a few more seconds ⏰',
    'Getting your automation game on 🎮',
    'Figuring out the best way to help 🗺️',
    'Warming up, almost showtime 🎪',
]

function ChatThinkingLoader({
    onStop,
    className,
}: {
    onStop?: () => void
    className?: string
}) {
    const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * MESSAGES.length));

    const rotateMessage = useCallback(() => {
        setMessageIndex((i) => pickRandomIndex(i, MESSAGES.length));
    }, []);

    useEffect(() => {
        const interval = setInterval(rotateMessage, 6000);
        return () => clearInterval(interval);
    }, [rotateMessage]);

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <div className="flex items-center gap-1.5">
                <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                />
            </div>

            <div className="h-5 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={messageIndex}
                        className="text-sm text-muted-foreground"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                    >
                        {t(MESSAGES[messageIndex])}
                    </motion.span>
                </AnimatePresence>
            </div>

            {onStop && (
                <button
                    type="button"
                    onClick={onStop}
                    className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Square className="h-2.5 w-2.5 fill-current" />
                    {t('Stop')}
                </button>
            )}
        </div>
    );
}

export { ChatThinkingLoader };

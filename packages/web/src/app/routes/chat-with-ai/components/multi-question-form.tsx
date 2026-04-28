import { t } from 'i18next';
import { Check, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { MultiQuestion } from '../lib/message-parsers';

export function MultiQuestionForm({
  questions,
  onSubmit,
}: {
  questions: MultiQuestion[];
  onSubmit: (text: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = questions.filter((_q, i) => answers[i]?.trim()).length;
  const allAnswered = answeredCount === questions.length;

  function handleChoiceSelect(index: number, option: string) {
    if (submitted) return;
    setAnswers((prev) =>
      prev[index] === option
        ? { ...prev, [index]: '' }
        : { ...prev, [index]: option },
    );
  }

  function handleTextChange(index: number, value: string) {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }

  function handleSubmit() {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    const lines = questions.map((q, i) => `- **${q.question}** ${answers[i]}`);
    onSubmit(lines.join('\n'));
  }

  return (
    <motion.div
      className="my-2 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {questions.map((q, i) => (
        <motion.div
          key={i}
          className="space-y-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.08 }}
        >
          <p className="text-sm font-medium">{q.question}</p>

          {q.type === 'choice' && q.options && (
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={submitted}
                  onClick={() => handleChoiceSelect(i, option)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    answers[i] === option
                      ? 'border-primary text-primary bg-primary/5'
                      : 'bg-background hover:bg-muted',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {q.type === 'text' && (
            <Input
              className="h-9 text-sm"
              placeholder={q.placeholder}
              value={answers[i] ?? ''}
              disabled={submitted}
              onChange={(e) => handleTextChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && allAnswered) handleSubmit();
              }}
            />
          )}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: questions.length * 0.08 }}
      >
        <Button
          size="sm"
          className="gap-1.5 rounded-full mt-1"
          disabled={!allAnswered || submitted}
          onClick={handleSubmit}
        >
          {submitted ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t('Submitted')}
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              {t('Submit answers')}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}

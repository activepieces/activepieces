const BARS = [
  { duration: '0.8s', delay: '0s' },
  { duration: '0.6s', delay: '0.15s' },
  { duration: '0.9s', delay: '0.05s' },
  { duration: '0.7s', delay: '0.2s' },
  { duration: '0.85s', delay: '0.1s' },
];

function VoiceWaveformBars() {
  return (
    <div className="flex h-3.5 items-center gap-[2px]">
      {BARS.map((bar, i) => (
        <span
          key={i}
          className="w-[3px] h-full rounded-full bg-foreground origin-center animate-[voice-bar_ease-in-out_infinite_alternate]"
          style={{
            animationDuration: bar.duration,
            animationDelay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}

export { VoiceWaveformBars };

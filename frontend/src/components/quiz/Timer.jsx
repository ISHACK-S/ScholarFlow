function Timer({ secondsLeft }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
      Time left: {secondsLeft}s
    </div>
  );
}

export default Timer;

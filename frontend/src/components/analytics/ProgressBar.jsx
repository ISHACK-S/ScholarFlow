function ProgressBar({ value }) {
  return (
    <div className="h-2 rounded-full bg-slate-200">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default ProgressBar;

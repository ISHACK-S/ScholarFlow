function StrongTopics({ items }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Strong Topics</p>
      <ul className="mt-2 space-y-2 text-sm text-slate-600">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}

export default StrongTopics;

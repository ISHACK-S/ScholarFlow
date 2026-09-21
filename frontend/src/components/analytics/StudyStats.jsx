function StudyStats({ studyTime, completion }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Study Stats</p>
      <p className="mt-2 text-sm text-slate-600">Study time: {studyTime} min</p>
      <p className="mt-1 text-sm text-slate-600">Completion: {completion}%</p>
    </div>
  );
}

export default StudyStats;

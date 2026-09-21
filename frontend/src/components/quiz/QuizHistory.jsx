function QuizHistory({ attempts }) {
  if (!attempts.length) {
    return <p className="mt-3 text-sm text-slate-600">No quiz attempts yet.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {attempts.map((attempt, index) => (
        <div key={attempt.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Attempt {index + 1}</span>
            <span>{attempt.created_at ? new Date(attempt.created_at).toLocaleDateString() : 'Recently'}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <span>Score: {attempt.score}</span>
            <span>Percentage: {attempt.percentage}%</span>
            <span>Time: {attempt.time_taken}s</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuizHistory;

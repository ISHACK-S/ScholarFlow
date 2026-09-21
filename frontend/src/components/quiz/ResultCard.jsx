function ResultCard({ score, correctAnswers, wrongAnswers, percentage, timeTaken }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-xl font-semibold text-slate-900">Quiz completed</h3>
      <p className="mt-2 text-sm text-slate-600">Score: {score}/{correctAnswers + wrongAnswers}</p>
      <p className="mt-1 text-sm text-slate-600">Correct: {correctAnswers} | Wrong: {wrongAnswers}</p>
      <p className="mt-1 text-sm text-slate-600">Percentage: {percentage}%</p>
      <p className="mt-1 text-sm text-slate-600">Time taken: {timeTaken}s</p>
    </div>
  );
}

export default ResultCard;

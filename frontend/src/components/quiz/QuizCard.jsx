function QuizCard({ title, description, onStart }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <button onClick={onStart} className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
        Start Quiz
      </button>
    </div>
  );
}

export default QuizCard;

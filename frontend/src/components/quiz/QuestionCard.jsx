function QuestionCard({ question, options, selectedAnswer, onSelect }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">{question}</h3>
      <div className="mt-4 space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <input type="radio" checked={selectedAnswer === option} onChange={() => onSelect(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default QuestionCard;

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

import QuestionCard from '../components/quiz/QuestionCard';
import Timer from '../components/quiz/Timer';
import ResultCard from '../components/quiz/ResultCard';
import QuizHistory from '../components/quiz/QuizHistory';
import api from '../services/api';

const DEFAULT_QUIZ = [
  {
    question: 'Which algorithm is commonly used for clustering?',
    options: [
      'Linear Regression',
      'K-Means',
      'Logistic Regression',
      'Naive Bayes',
    ],
    correct_answer: 'K-Means',
  },

  {
    question: 'Which learning type uses labelled data?',
    options: [
      'Supervised',
      'Unsupervised',
      'Clustering',
      'Dimensionality reduction',
    ],
    correct_answer: 'Supervised',
  },

  {
    question: 'What does regression usually predict?',
    options: [
      'A continuous value',
      'A file type',
      'A cluster label only',
      'A database schema',
    ],
    correct_answer: 'A continuous value',
  },

  {
    question: 'What is the purpose of a validation set?',
    options: [
      'Tune model choices',
      'Store passwords',
      'Create labels automatically',
      'Replace training data',
    ],
    correct_answer: 'Tune model choices',
  },

  {
    question: 'What does probability measure?',
    options: [
      'The likelihood of an event',
      'The size of a dataset',
      'The number of model layers',
      'The speed of a processor',
    ],
    correct_answer: 'The likelihood of an event',
  },
];

const QUIZ_RESULTS_KEY = 'scholarflow_quiz_results';

function readQuizResults() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(QUIZ_RESULTS_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

// ======================================================
// SAFE QUIZ NORMALIZER
// ======================================================

function normalizeQuiz(value) {
  let parsed = value;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((item) => {
    return (
      item &&
      typeof item.question === 'string' &&
      item.question.trim().length > 0 &&
      Array.isArray(item.options) &&
      item.options.length >= 2 &&
      typeof item.correct_answer === 'string' &&
      item.options.includes(item.correct_answer)
    );
  });
}

// ======================================================
// QUIZ PAGE
// ======================================================

function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const noteId = location.state?.note_id || location.state?.note?.id;

  // ----------------------------------------------------
  // GET QUIZ FROM DASHBOARD
  // ----------------------------------------------------

  const incomingQuiz = useMemo(() => {
    return normalizeQuiz(location.state?.quiz);
  }, [location.state?.quiz]);

  const [quiz, setQuiz] = useState(
    noteId
      ? incomingQuiz
      : incomingQuiz.length > 0
      ? incomingQuiz
      : DEFAULT_QUIZ
  );

  // ----------------------------------------------------
  // STATE
  // ----------------------------------------------------

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState(readQuizResults);

  // 2 minutes
  const [timer, setTimer] = useState(120);

  const [timeExpired, setTimeExpired] = useState(false);

  useEffect(() => {
    if (!noteId) return undefined;
    api.get(`/quiz/${noteId}`)
      .then((response) => setQuiz(normalizeQuiz(response.data.quiz)))
      .catch(() => setQuiz([]));
    api.get(`/quiz-history/${noteId}`)
      .then((response) => setHistory(response.data.history || []))
      .catch(() => setHistory([]));
    return undefined;
  }, [noteId]);

  // ----------------------------------------------------
  // TIMER
  // ----------------------------------------------------

  useEffect(() => {
    if (submitted || timer <= 0 || quiz.length === 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimer((previous) => {
        if (previous <= 1) {
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, timer, quiz.length]);

  // ----------------------------------------------------
  // CURRENT QUESTION
  // ----------------------------------------------------

  const currentQuestion = quiz[currentIndex];

  // ----------------------------------------------------
  // ANSWER COUNT
  // ----------------------------------------------------

  const answeredCount = Object.keys(answers).length;

  // ----------------------------------------------------
  // PROGRESS
  // ----------------------------------------------------

  const progress = quiz.length
    ? Math.round(
        ((currentIndex + 1) / quiz.length) * 100
      )
    : 0;

  // ----------------------------------------------------
  // SELECT ANSWER
  // ----------------------------------------------------

  function handleAnswerSelect(value) {
    if (submitted) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentIndex]: value,
    }));
  }

  // ----------------------------------------------------
  // SUBMIT QUIZ
  // ----------------------------------------------------

  function submitQuiz(expired = false) {
    if (submitted || !quiz.length) {
      return;
    }

    const correctAnswers = quiz.reduce(
      (total, question, index) => {
        return (
          total +
          (answers[index] === question.correct_answer
            ? 1
            : 0)
        );
      },
      0
    );

    const wrongAnswers =
      quiz.length - correctAnswers;

    const percentage = Math.round(
      (correctAnswers / quiz.length) * 100
    );

    const timeTaken = Math.min(
      120,
      120 - timer
    );

    const quizResult = {
      id: `attempt-${Date.now()}`,

      score: correctAnswers,

      correct_answers: correctAnswers,

      wrong_answers: wrongAnswers,

      total_questions: quiz.length,

      percentage,

      time_taken: timeTaken,

      time_expired: expired,

      created_at: new Date().toISOString(),
    };

    if (noteId) {
      api.post('/submit-quiz', {
        note_id: noteId,
        answers,
        time_taken: timeTaken,
      }).then((response) => setResult({ ...quizResult, ...response.data }))
        .catch(() => setResult(quizResult));
      api.get(`/quiz-history/${noteId}`)
        .then((response) => setHistory(response.data.history || []))
        .catch(() => setHistory([quizResult, ...readQuizResults()]));
    }

    setResult(quizResult);

    const nextHistory = [quizResult, ...readQuizResults()];
    sessionStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(nextHistory));
    if (!noteId) setHistory(nextHistory);

    setSubmitted(true);
  }

  // ----------------------------------------------------
  // TIME UP
  // ----------------------------------------------------

  useEffect(() => {
    if (timer === 0 && !submitted) {
      setTimeExpired(true);
      submitQuiz(true);
    }
  }, [timer, submitted]);

  // ----------------------------------------------------
  // NEXT QUESTION
  // ----------------------------------------------------

  function handleNext() {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(
        (previous) => previous + 1
      );
    }
  }

  // ----------------------------------------------------
  // PREVIOUS QUESTION
  // ----------------------------------------------------

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(
        (previous) => previous - 1
      );
    }
  }

  // ----------------------------------------------------
  // RETRY
  // ----------------------------------------------------

  function retryQuiz() {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setResult(null);
    setTimer(120);
    setTimeExpired(false);
  }

  // ----------------------------------------------------
  // EMPTY QUIZ SAFETY
  // ----------------------------------------------------

  if (!quiz.length) {
    return (
      <div className="min-h-screen bg-background">

        <Navbar title="Quiz" />

        <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">

          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">

            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <div className="text-5xl">
                📝
              </div>

              <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                No Quiz Available
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                There are currently no valid quiz questions
                available.
              </p>

              <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Return to Dashboard
              </button>

            </div>

          </main>

        </div>
      </div>
    );
  }

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div className="min-h-screen bg-background">

      <Navbar title="Quiz" />

      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">

        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            {!submitted ? (

              // ==================================================
              // QUIZ
              // ==================================================

              <div className="space-y-6">

                {/* HEADER */}

                <div className="flex flex-wrap items-start justify-between gap-4">

                  <div>

                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                      ScholarFlow AI Quiz
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      Question {currentIndex + 1} of{' '}
                      {quiz.length}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {answeredCount} of{' '}
                      {quiz.length} answered
                    </p>

                  </div>

                  <Timer secondsLeft={timer} />

                </div>

                {/* PROGRESS */}

                <div>

                  <div className="flex justify-between text-xs text-slate-500">

                    <span>
                      Quiz Progress
                    </span>

                    <span>
                      {progress}%
                    </span>

                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                </div>

                {/* QUESTION */}

                <QuestionCard
                  question={
                    currentQuestion.question
                  }
                  options={
                    currentQuestion.options
                  }
                  selectedAnswer={
                    answers[currentIndex]
                  }
                  onSelect={
                    handleAnswerSelect
                  }
                />

                {/* NAVIGATION */}

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <button
                    onClick={handlePrevious}
                    disabled={
                      currentIndex === 0
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-3">

                    {currentIndex <
                    quiz.length - 1 ? (

                      <button
                        onClick={handleNext}
                        className="rounded-xl bg-primary px-5 py-2 font-semibold text-white transition hover:bg-blue-700"
                      >
                        Next →
                      </button>

                    ) : (

                      <button
                        onClick={() =>
                          submitQuiz(false)
                        }
                        className="rounded-xl bg-secondary px-5 py-2 font-semibold text-white transition hover:opacity-90"
                      >
                        Submit Quiz
                      </button>

                    )}

                  </div>

                </div>

                {/* UNANSWERED WARNING */}

                {currentIndex ===
                  quiz.length - 1 &&
                  answeredCount <
                    quiz.length && (
                    <div className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
                      You have{' '}
                      {quiz.length -
                        answeredCount}{' '}
                      unanswered question(s).
                      Unanswered questions will
                      be counted as incorrect.
                    </div>
                  )}

              </div>

            ) : (

              // ==================================================
              // RESULT
              // ==================================================

              <div className="space-y-6">

                <div className="text-center">

                  <div className="text-5xl">
                    {result.percentage >= 80
                      ? '🎉'
                      : result.percentage >=
                        50
                      ? '👍'
                      : '📚'}
                  </div>

                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                    Quiz Completed!
                  </h2>

                  {timeExpired && (
                    <p className="mt-2 text-sm font-medium text-orange-600">
                      ⏰ Time ran out. Your quiz
                      was submitted automatically.
                    </p>
                  )}

                </div>

                {/* RESULT CARD */}

                <ResultCard
                  score={result.score}
                  correctAnswers={
                    result.correct_answers
                  }
                  wrongAnswers={
                    result.wrong_answers
                  }
                  percentage={
                    result.percentage
                  }
                  timeTaken={
                    result.time_taken
                  }
                />

                {/* RESULT SUMMARY */}

                <div className="grid gap-4 sm:grid-cols-3">

                  <div className="rounded-2xl bg-green-50 p-4 text-center">

                    <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                      Correct
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-700">
                      {result.correct_answers}
                    </p>

                  </div>

                  <div className="rounded-2xl bg-red-50 p-4 text-center">

                    <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                      Wrong
                    </p>

                    <p className="mt-1 text-2xl font-bold text-red-700">
                      {result.wrong_answers}
                    </p>

                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4 text-center">

                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Percentage
                    </p>

                    <p className="mt-1 text-2xl font-bold text-primary">
                      {result.percentage}%
                    </p>

                  </div>

                </div>

                {/* HISTORY */}

                <QuizHistory
                  attempts={history}
                />

                {/* ACTIONS */}

                <div className="flex flex-wrap justify-center gap-3">

                  <button
                    onClick={retryQuiz}
                    className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    🔄 Retry Quiz
                  </button>

                  <button
                    onClick={() =>
                      navigate('/dashboard')
                    }
                    className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    ← Return to Dashboard
                  </button>

                </div>

              </div>

            )}

          </div>

        </main>

      </div>

    </div>
  );
}

export default QuizPage;
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getMockNotes, mockQuiz } from '../data/mockData';
import api from '../services/api';

function NoteDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(() => getMockNotes().find((item) => item.id === id));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/notes/${id}`)
      .then((response) => setNote(response.data))
      .catch(() => setError('Unable to load this note from the backend.'))
      .finally(() => setLoading(false));
  }, [id]);

  const normalizedNote = useMemo(() => {
    if (!note) return null;
    const list = (value) => Array.isArray(value) ? value : String(value || '').split('\n').filter(Boolean);
    return { ...note, key_points: list(note.key_points), definitions: list(note.definitions), formulas: list(note.formulas) };
  }, [note]);

  if (loading) {
    return <div className="min-h-screen bg-background p-8 text-center text-slate-600">Loading note details...</div>;
  }

  if (!normalizedNote) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Note Details" />
        <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Note not found</h2>
              <p className="mt-2 text-sm text-slate-500">{error || 'This note is not available.'}</p>
              <button onClick={() => navigate('/dashboard')} className="mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-white">Back to Dashboard</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const quiz = Array.isArray(normalizedNote.quiz) && normalizedNote.quiz.length ? normalizedNote.quiz : mockQuiz;

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Note Details" />
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Study Material</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">{normalizedNote.title || normalizedNote.file_name}</h1>
                <p className="mt-2 text-sm text-slate-500">{normalizedNote.file_name}</p>
              </div>
              <button onClick={() => navigate('/dashboard')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Back to Dashboard</button>
            </div>

            <section className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">Summary</h2>
              <p className="mt-3 leading-7 text-slate-600">{normalizedNote.summary || 'No summary is available for this note yet.'}</p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">Key Points</h2>
              {normalizedNote.key_points?.length ? (
                <ul className="mt-3 space-y-2 text-slate-600">
                  {normalizedNote.key_points.map((point) => <li key={point}>✓ {point}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-slate-500">No key points available.</p>}
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">Definitions</h2>
              {normalizedNote.definitions?.length ? (
                <div className="mt-3 space-y-3">
                  {normalizedNote.definitions.map((definition) => <p key={definition} className="rounded-xl bg-slate-50 p-3 text-slate-600">{definition}</p>)}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">No definitions available.</p>}
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">Formulas</h2>
              {normalizedNote.formulas?.length ? (
                <ul className="mt-3 space-y-2 font-mono text-sm text-slate-600">
                  {normalizedNote.formulas.map((formula) => <li key={formula} className="rounded-xl bg-slate-50 p-3">{formula}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-slate-500">No formulas available.</p>}
            </section>

            <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <button onClick={() => navigate('/quiz', { state: { quiz, note_id: normalizedNote.id } })} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white">Start Quiz</button>
              <button onClick={() => navigate(`/video-script/${normalizedNote.id}`, { state: { note: normalizedNote } })} className="rounded-xl bg-secondary px-5 py-3 font-semibold text-white">View Video Script</button>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}

export default NoteDetailsPage;

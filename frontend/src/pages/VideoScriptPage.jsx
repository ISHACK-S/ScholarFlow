import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getMockNotes } from '../data/mockData';
import api from '../services/api';

function VideoScriptPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const initialNote = useMemo(
    () => location.state?.note || getMockNotes().find((item) => item.id === id),
    [id, location.state?.note],
  );
  const [note, setNote] = useState(initialNote);
  useEffect(() => {
    if (!id || location.state?.note) return undefined;
    api.get(`/notes/${id}`).then((response) => setNote(response.data)).catch(() => {});
    return undefined;
  }, [id, location.state?.note]);
  const script = note?.video_script || location.state?.script || 'No video script is available for this note.';
  const title = note?.title || location.state?.title || 'Study Video Script';

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Video Script" />
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Study Script</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
              </div>
              <button onClick={() => navigate(note ? `/note/${note.id}` : '/dashboard')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                {note ? 'Back to Note' : 'Back to Dashboard'}
              </button>
            </div>

            <div className="mt-8 space-y-6 text-slate-600">
              <section>
                <h2 className="text-xl font-semibold text-slate-900">Introduction</h2>
                <p className="mt-2 leading-7">{script}</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-slate-900">Main Concepts</h2>
                <p className="mt-2 leading-7">This script reviews the core ideas from the selected study material and connects definitions with practical examples.</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-slate-900">Explanation</h2>
                <p className="mt-2 leading-7">Pause after each concept, explain it in your own words, and use the quiz to check whether the idea is clear.</p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-slate-900">Conclusion</h2>
                <p className="mt-2 leading-7">Review the key points once more, then return to your roadmap and choose the next topic to study.</p>
              </section>
            </div>

            <button onClick={() => navigate('/dashboard')} className="mt-10 rounded-xl bg-primary px-5 py-3 font-semibold text-white">Back to Dashboard</button>
          </article>
        </main>
      </div>
    </div>
  );
}

export default VideoScriptPage;

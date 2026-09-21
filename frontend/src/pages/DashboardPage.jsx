import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UploadNotesCard from '../components/UploadNotesCard';
import LoadingSpinner from '../components/LoadingSpinner';

import AnalyticsCard from '../components/analytics/AnalyticsCard';
import ProgressBar from '../components/analytics/ProgressBar';
import RecentActivity from '../components/analytics/RecentActivity';
import StudyStats from '../components/analytics/StudyStats';
import StrongTopics from '../components/analytics/StrongTopics';
import WeakTopics from '../components/analytics/WeakTopics';
import { getMockNotes, mockCareerPaths, mockRoadmap, mockSkills, saveMockNote } from '../data/mockData';
import api from '../services/api';

const QUIZ_RESULTS_KEY = 'scholarflow_quiz_results';

const DEMO_SKILLS = mockSkills.map(({ name, score }) => ({ name, score }));
const ROADMAP_ITEMS = mockRoadmap.map(({ title, status }) => [title, status]);
const CAREER_MATCHES = mockCareerPaths.map(({ name, match }) => [name, match]);

function readQuizResults() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(QUIZ_RESULTS_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function getQuizStats(results) {
  if (!results.length) {
    return {
      latestScore: null,
      latestTotal: null,
      bestScore: null,
      bestTotal: null,
      averageScore: null,
      attempts: 0,
    };
  }

  const latest = results[0];
  const best = results.reduce((currentBest, result) => (
    result.percentage > currentBest.percentage ? result : currentBest
  ), results[0]);

  return {
    latestScore: latest.score,
    latestTotal: latest.total_questions,
    bestScore: best.score,
    bestTotal: best.total_questions,
    averageScore: Math.round(results.reduce((sum, result) => sum + result.percentage, 0) / results.length),
    attempts: results.length,
  };
}

function getSkillScores(results) {
  if (!results.length) {
    return DEMO_SKILLS;
  }

  const latestPercentage = results[0].percentage;
  return DEMO_SKILLS.map((skill) => ({
    ...skill,
    score: Math.round((skill.score * 0.75) + (latestPercentage * 0.25)),
  }));
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function normalizeQuizValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeNote(note) {
  return {
    ...note,
    title: note.title || note.file_name,
    key_points: normalizeList(note.key_points),
    definitions: normalizeList(note.definitions),
    formulas: normalizeList(note.formulas),
    quiz: normalizeQuizValue(note.quiz),
  };
}

function DashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [notes, setNotes] = useState([]);

  const [quizStats, setQuizStats] = useState({
    latestScore: 0,
    latestTotal: 10,
    bestScore: 0,
    bestTotal: 10,
    averageScore: 0,
    attempts: 0,
  });

  const [skillScores, setSkillScores] = useState(DEMO_SKILLS);

  const [analyticsStats, setAnalyticsStats] = useState({
    study_time_minutes: 0,
    notes_uploaded: 0,
    notes_completed: 0,
    average_quiz_score: 0,
    best_quiz_score: 0,
    weak_topics: [],
    strong_topics: [],
    completion_percentage: 0,
    recent_activity: [],
  });

  // =====================================================
  // MOCK FRONTEND DATA
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotes([
        {
          id: 'note-1',
          file_name: 'Machine Learning - Unit 1.pdf',
          created_at: '2026-09-18T10:30:00Z',
          summary:
            'Introduction to machine learning, supervised learning, unsupervised learning, regression, classification and clustering.',
          key_points: [
            'Machine learning learns patterns from data.',
            'Supervised learning uses labelled data.',
            'Unsupervised learning discovers hidden patterns.',
          ],
          quiz: [
            {
              question:
                'Which algorithm is commonly used for clustering?',
              options: [
                'Linear Regression',
                'K-Means',
                'Logistic Regression',
                'Naive Bayes',
              ],
              correct_answer: 'K-Means',
            },
            {
              question:
                'Which type of learning uses labelled data?',
              options: [
                'Supervised',
                'Unsupervised',
                'Reinforcement',
                'Clustering',
              ],
              correct_answer: 'Supervised',
            },
          ],
          video_script:
            'Welcome to Machine Learning Unit 1. In this lesson, we will learn the basics of machine learning and its major types.',
        },

        {
          id: 'note-2',
          file_name: 'Operating Systems - Unit 4.pdf',
          created_at: '2026-09-17T15:20:00Z',
          summary:
            'Study material covering memory management, paging, page tables and virtual memory.',
          key_points: [
            'Paging divides memory into fixed-size pages.',
            'Page tables map virtual addresses to physical addresses.',
            'Virtual memory allows efficient memory management.',
          ],
          quiz: [
            {
              question: 'What does a page table store?',
              options: [
                'CPU instructions',
                'Virtual-to-physical address mappings',
                'User passwords',
                'File names',
              ],
              correct_answer:
                'Virtual-to-physical address mappings',
            },
          ],
          video_script:
            'Welcome to Operating Systems Unit 4. This lesson explains paging, page tables and virtual memory.',
        },

        {
          id: 'note-3',
          file_name: 'Data Structures - Trees.pdf',
          created_at: '2026-09-16T09:15:00Z',
          summary:
            'Introduction to trees, binary trees, binary search trees and tree traversal techniques.',
          key_points: [
            'A tree is a hierarchical data structure.',
            'Binary trees have at most two children per node.',
            'Traversal techniques include inorder, preorder and postorder.',
          ],
          quiz: [],
          video_script:
            'Welcome to Data Structures. In this lesson, we will explore trees and different tree traversal techniques.',
        },
      ]);
      setNotes(getMockNotes());

      const quizResults = readQuizResults();
      const calculatedQuizStats = getQuizStats(quizResults);
      const calculatedSkillScores = getSkillScores(quizResults);
      setQuizStats(calculatedQuizStats);
      setSkillScores(calculatedSkillScores);

      setAnalyticsStats({
        study_time_minutes: 755,
        notes_uploaded: 8,
        notes_completed: 5,
        average_quiz_score: calculatedQuizStats.averageScore,
        best_quiz_score: quizResults.length ? Math.max(...quizResults.map((result) => result.percentage)) : null,

        weak_topics: [
          'Clustering',
          'Probability',
          'Page Tables',
        ],

        strong_topics: [
          'Regression',
          'Classification',
          'Paging',
        ],

        completion_percentage: 68,

        recent_activity: [
          {
            action: 'Completed ML Quiz',
            timestamp: '2026-09-19T11:30:00Z',
          },
          {
            action: 'Uploaded Machine Learning notes',
            timestamp: '2026-09-18T10:30:00Z',
          },
          {
            action: 'Reviewed Operating Systems notes',
            timestamp: '2026-09-17T15:20:00Z',
          },
        ],
      });

      Promise.all([
        api.get('/notes'),
        api.get('/quiz-stats'),
        api.get('/analytics/dashboard'),
      ]).then(([notesResponse, quizResponse, analyticsResponse]) => {
        const backendNotes = notesResponse.data.notes || [];
        setNotes(backendNotes.map(normalizeNote));
        const backendQuiz = quizResponse.data;
        setQuizStats({
          latestScore: backendQuiz.latestScore ?? null,
          latestTotal: backendQuiz.latestTotal ?? null,
          bestScore: backendQuiz.bestScore ?? null,
          bestTotal: backendQuiz.bestTotal ?? null,
          averageScore: backendQuiz.averageScore ?? null,
          attempts: backendQuiz.attempts ?? 0,
        });
        setAnalyticsStats((previous) => ({ ...previous, ...analyticsResponse.data }));
        setMessage('Connected to the ScholarFlow backend.');
      }).catch(() => {
        setMessage('Backend connection unavailable. Showing demo data.');
      });

      setMessage('Frontend demo mode is active.');
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncQuizResults = () => {
      const quizResults = readQuizResults();
      const calculatedQuizStats = getQuizStats(quizResults);
      const calculatedSkillScores = getSkillScores(quizResults);
      setQuizStats(calculatedQuizStats);
      setSkillScores(calculatedSkillScores);
      setAnalyticsStats((previous) => ({
        ...previous,
        average_quiz_score: calculatedQuizStats.averageScore,
        best_quiz_score: quizResults.length
          ? Math.max(...quizResults.map((result) => result.percentage))
            : null,
      }));
    };

    window.addEventListener('focus', syncQuizResults);
    return () => window.removeEventListener('focus', syncQuizResults);
  }, []);

  // =====================================================
  // SAFE QUIZ NORMALIZER
  // =====================================================

  const normalizeQuiz = (quiz) => {
    if (Array.isArray(quiz)) {
      return quiz;
    }

    if (!quiz) {
      return [];
    }

    try {
      return JSON.parse(quiz);
    } catch {
      return [];
    }
  };

  // =====================================================
  // HANDLE UPLOAD SUCCESS
  // =====================================================

  const handleUploadSuccess = (data) => {
    const newNote = {
      id: data?.note_id || data?.id || `note-${Date.now()}`,

      file_name:
        data?.file_name || 'New Study Material.pdf',

      file_url: data?.file_url || '',

      created_at:
        data?.created_at || new Date().toISOString(),

      summary:
        data?.ai_content?.summary ||
        'Your study material has been processed successfully.',

      key_points:
        data?.ai_content?.key_points || [],

      definitions:
        data?.ai_content?.definitions || [],

      formulas:
        data?.ai_content?.formulas || [],

      quiz:
        normalizeQuiz(data?.ai_content?.quiz),

      video_script:
        data?.ai_content?.video_script || '',
    };

    setNotes((previousNotes) => [
      newNote,
      ...previousNotes,
    ]);
    saveMockNote(newNote);

    setAnalyticsStats((previous) => ({
      ...previous,
      notes_uploaded:
        previous.notes_uploaded + 1,
    }));

    setMessage('Note added successfully.');
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Dashboard" />

        <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
          <Sidebar />

          <main className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <LoadingSpinner />

              <p className="mt-4 text-sm text-slate-500">
                Preparing your study workspace...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Dashboard" />

      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">

          {/* ================================================= */}
          {/* WELCOME */}
          {/* ================================================= */}

          <div className="grid gap-6 lg:grid-cols-3">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Welcome Back 👋
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Your personalized study workspace
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Upload your notes, generate AI-powered study resources,
                practice with quizzes, identify skill gaps and build a
                personalized learning path.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">

                <button
                  onClick={() =>
                    document
                      .getElementById('upload-section')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Upload Notes
                </button>

                <button
                  onClick={() => navigate('/quiz')}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Take a Quiz
                </button>

              </div>
            </div>

            {/* STATUS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <h3 className="text-lg font-semibold text-slate-900">
                Workspace Status
              </h3>

              <div className="mt-4 rounded-2xl bg-green-50 p-4">

                <div className="flex items-center gap-2">

                  <span className="h-3 w-3 rounded-full bg-green-500" />

                  <p className="text-sm font-semibold text-green-700">
                    Demo Mode Active
                  </p>

                </div>

                <p className="mt-2 text-sm text-green-700">
                  {message}
                </p>

              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                The frontend is currently using sample learning data.
                Real FastAPI, Supabase, Gemini and ML integration will
                be connected later.
              </p>

            </div>
          </div>

          {/* ================================================= */}
          {/* UPLOAD + QUICK ACTIONS */}
          {/* ================================================= */}

          <div
            id="upload-section"
            className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
          >

            <UploadNotesCard
              onUploadSuccess={handleUploadSuccess}
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Quick Actions
              </p>

              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Continue Learning
              </h3>

              <div className="mt-5 space-y-3">

                <button
                  onClick={() =>
                    document
                      .getElementById('recent-notes')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  📚 Review Notes
                </button>

                <button
                  onClick={() => navigate('/quiz')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  📝 Take a Quiz
                </button>

                <button
                  onClick={() =>
                    navigate('/video-script', {
                      state: {
                        script:
                          notes[0]?.video_script || '',
                        title:
                          notes[0]?.file_name ||
                          'Study Script',
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  🎥 Open Study Script
                </button>

              </div>

              {/* QUIZ STATS */}

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Quiz Performance
                </p>

                <div className="mt-4 grid grid-cols-2 gap-4">

                  <div>
                    <p className="text-xs text-slate-500">
                      Latest
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {quizStats.latestScore === null ? '—' : `${quizStats.latestScore}/${quizStats.latestTotal}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Best
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {quizStats.bestScore === null ? '—' : `${quizStats.bestScore}/${quizStats.bestTotal}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Average
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {quizStats.averageScore === null ? '—' : `${quizStats.averageScore}%`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Attempts
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {quizStats.attempts}
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* ================================================= */}
          {/* ANALYTICS */}
          {/* ================================================= */}

          <div id="analytics" className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="grid gap-6 lg:grid-cols-2">

              <div>

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Learning Analytics
                </p>

                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Your progress snapshot
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Track your study activity and identify areas that
                  need more attention.
                </p>

              </div>

              <div className="rounded-2xl bg-slate-50 p-4">

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Overall Completion
                </p>

                <div className="mt-3">

                  <ProgressBar
                    value={
                      analyticsStats.completion_percentage
                    }
                  />

                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {analyticsStats.completion_percentage}%
                    completed
                  </p>

                </div>
              </div>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              <StudyStats
                studyTime={
                  analyticsStats.study_time_minutes
                }
                completion={
                  analyticsStats.completion_percentage
                }
              />

              <AnalyticsCard
                title="Notes Uploaded"
                value={
                  analyticsStats.notes_uploaded
                }
                subtitle="Study materials"
              />

              <AnalyticsCard
                title="Avg Quiz Score"
                value={analyticsStats.average_quiz_score === null ? '—' : `${analyticsStats.average_quiz_score}%`}
                subtitle="Across attempts"
              />

              <AnalyticsCard
                title="Best Quiz Score"
                value={analyticsStats.best_quiz_score === null ? '—' : `${analyticsStats.best_quiz_score}%`}
                subtitle="Highest result"
              />

            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">

              <WeakTopics
                items={analyticsStats.weak_topics}
              />

              <StrongTopics
                items={analyticsStats.strong_topics}
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Recent Activity
                </p>

                <div className="mt-3">
                  <RecentActivity
                    items={
                      analyticsStats.recent_activity
                    }
                  />
                </div>

              </div>

            </div>
          </div>

          {/* ================================================= */}
          {/* RECENT NOTES */}
          {/* ================================================= */}

          <div
            id="recent-notes"
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Recent Notes
                </p>

                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Your Study Materials
                </h3>

              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
                {notes.length} materials
              </span>

            </div>

            <div className="mt-6 space-y-4">

              {notes.map((note) => (

                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:shadow-sm"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex-1">

                      <div className="flex items-start gap-3">

                        <div className="rounded-xl bg-blue-100 p-3">
                          📄
                        </div>

                        <div>

                          <h4 className="font-semibold text-slate-900">
                            {note.file_name}
                          </h4>

                          <p className="mt-1 text-xs text-slate-500">
                            Uploaded{' '}
                            {new Date(
                              note.created_at
                            ).toLocaleDateString()}
                          </p>

                        </div>

                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-700">
                        {note.summary}
                      </p>

                      {note.key_points?.length > 0 && (
                        <div className="mt-4">

                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Key Points
                          </p>

                          <ul className="mt-2 space-y-1">

                            {note.key_points
                              .slice(0, 3)
                              .map((point, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-slate-600"
                                >
                                  • {point}
                                </li>
                              ))}

                          </ul>

                        </div>
                      )}

                    </div>

                    <div className="flex flex-wrap gap-2">

                      <button
                        onClick={() => navigate(`/note/${note.id}`)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View Note
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/quiz`, {
                            state: {
                              quiz: normalizeQuiz(
                                note.quiz
                              ),
                              note_id: note.id,
                            },
                          })
                        }
                        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        View Quiz
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/video-script/${note.id}`, { state: { note } })
                        }
                        className="rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        View Script
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          </div>

          {/* ================================================= */}
          {/* SCHOLARFLOW INTELLIGENCE */}
          {/* ================================================= */}

          <div className="mt-10">

            <div className="mb-6">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                ScholarFlow Intelligence
              </p>

              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Personalized Learning Intelligence
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Use your learning activity and quiz performance to
                understand your skills, identify gaps, plan your next
                topics and explore possible career directions.
              </p>

            </div>

            <div className="grid gap-6 lg:grid-cols-3">

              {/* ================================================= */}
              {/* 1. SKILL GAP */}
              {/* ================================================= */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div className="rounded-2xl bg-blue-50 p-3 text-2xl">
                    🧠
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Analysis Ready
                  </span>

                </div>

                <h4 className="mt-5 text-xl font-semibold text-slate-900">
                  Skill Gap Intelligence
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Identify strong and weak concepts from your
                  learning performance.
                </p>

                <div className="mt-5 space-y-4">

                  {skillScores.map(({ name: skill, score }) => (

                    <div key={skill}>

                      <div className="flex justify-between text-sm">

                        <span className="font-medium text-slate-700">
                          {skill}
                        </span>

                        <span className="font-semibold text-slate-600">
                          {score}%
                        </span>

                      </div>

                      <div className="mt-2 h-2 rounded-full bg-slate-100">

                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${score}%`,
                          }}
                        />

                      </div>

                    </div>

                  ))}

                </div>

                <div className="mt-5 rounded-2xl bg-orange-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                    Recommended Focus
                  </p>

                  <p className="mt-1 text-sm font-semibold text-orange-800">
                    Clustering & Probability
                  </p>

                  <p className="mt-1 text-xs leading-5 text-orange-700">
                    These concepts currently have lower demo
                    performance.
                  </p>

                </div>

                <button
                  onClick={() =>
                    document
                      .getElementById('skill-gap-section')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  View Skill Analysis
                </button>

              </div>

              {/* ================================================= */}
              {/* 2. ROADMAP */}
              {/* ================================================= */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div className="rounded-2xl bg-purple-50 p-3 text-2xl">
                    🗺️
                  </div>

                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                    Personalized
                  </span>

                </div>

                <h4 className="mt-5 text-xl font-semibold text-slate-900">
                  Personalized Learning Roadmap
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Follow a recommended learning sequence based on
                  your current skill level.
                </p>

                <div className="mt-5 space-y-4">

                  {ROADMAP_ITEMS.map(([title, status], index) => (

                    <div key={title}>

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-green-100 text-green-700'
                              : index === 1
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {index === 0 ? '✓' : index + 1}
                        </div>

                        <div>

                          <p className="text-sm font-semibold text-slate-800">
                            {title}
                          </p>

                          <p
                            className={`text-xs ${
                              index === 1
                                ? 'text-blue-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {status}
                          </p>

                        </div>

                      </div>

                      {index < 3 && (
                        <div className="ml-4 mt-1 h-4 border-l-2 border-slate-200" />
                      )}

                    </div>

                  ))}

                </div>

                <button
                  onClick={() =>
                    document
                      .getElementById('roadmap-section')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="mt-5 w-full rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
                >
                  View Full Roadmap
                </button>

              </div>

              {/* ================================================= */}
              {/* 3. CAREER PATH */}
              {/* ================================================= */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div className="rounded-2xl bg-emerald-50 p-3 text-2xl">
                    🚀
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Exploration
                  </span>

                </div>

                <h4 className="mt-5 text-xl font-semibold text-slate-900">
                  Career Path Exploration
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Explore career directions based on the skills
                  you are currently developing.
                </p>

                <div className="mt-5 space-y-3">

                  {CAREER_MATCHES.map(([career, match]) => (

                    <div
                      key={career}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >

                      <div className="flex items-center justify-between">

                        <p className="text-sm font-semibold text-slate-800">
                          {career}
                        </p>

                        <span className="text-sm font-bold text-primary">
                          {match}%
                        </span>

                      </div>

                      <div className="mt-2 h-2 rounded-full bg-slate-200">

                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${match}%`,
                          }}
                        />

                      </div>

                    </div>

                  ))}

                </div>

                <button
                  onClick={() =>
                    document
                      .getElementById('career-section')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Explore Career Paths
                </button>

              </div>

            </div>
          </div>

          {/* ================================================= */}
          {/* DETAILED SKILL GAP */}
          {/* ================================================= */}

          <div
            id="skill-gap-section"
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Skill Gap Intelligence
            </p>

            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Detailed Skill Analysis
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Demo skill scores based on sample quiz performance.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {skillScores.map(({ name: skill, score }) => (
                <div key={skill} className="rounded-2xl bg-slate-50 p-5">
                  <p className="font-semibold text-slate-800">{skill}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{score}%</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${score}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {score >= 75 ? 'Strong' : score >= 60 ? 'Needs Practice' : 'Needs Improvement'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ================================================= */}
          {/* PERSONALIZED ROADMAP */}
          {/* ================================================= */}

          <div
            id="roadmap-section"
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Personalized Roadmap
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Your Recommended Learning Path
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Demo roadmap generated from the current sample skill gaps.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {ROADMAP_ITEMS.map(([title, status], index) => (
                <div key={title} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h4 className="mt-4 font-semibold text-slate-900">{title}</h4>
                  <p className="mt-2 text-sm text-slate-500">{status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ================================================= */}
          {/* CAREER PATH EXPLORATION */}
          {/* ================================================= */}

          <div
            id="career-section"
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Career Path Exploration
            </p>

            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Explore Career Directions
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              These are demo career compatibility values for the
              frontend prototype. They will later be calculated from
              the student's actual skill profile.
            </p>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Demo career compatibility
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              {[
                {
                  name: 'Data Scientist',
                  match: 78,
                  skills:
                    'Python • Statistics • Machine Learning',
                },
                {
                  name: 'ML Engineer',
                  match: 71,
                  skills:
                    'Python • ML • Model Deployment',
                },
                {
                  name: 'Data Analyst',
                  match: 86,
                  skills:
                    'SQL • Statistics • Visualization',
                },
              ].map((career) => (

                <div
                  key={career.name}
                  className="rounded-2xl border border-slate-200 p-5"
                >

                  <div className="flex items-center justify-between">

                    <h4 className="font-semibold text-slate-900">
                      {career.name}
                    </h4>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">
                      {career.match}%
                    </span>

                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Required Skills
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {career.skills}
                  </p>

                  <div className="mt-4 h-2 rounded-full bg-slate-100">

                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${career.match}%`,
                      }}
                    />

                  </div>

                  <button
                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View Required Skills
                  </button>

                </div>

              ))}

            </div>
          </div>

          {/* ================================================= */}
          {/* FOOTER NOTE */}
          {/* ================================================= */}

          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">

            <p className="text-sm font-semibold text-blue-900">
              🚧 Frontend Prototype
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              Skill scores, roadmap recommendations and career
              compatibility values are currently demo data. During
              backend integration, these values will be generated
              from real quiz results, learning analytics and ML
              models.
            </p>

          </div>

        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
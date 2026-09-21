export const mockQuiz = [
  {
    question: 'Which algorithm is commonly used for clustering?',
    options: ['Linear Regression', 'K-Means', 'Logistic Regression', 'Naive Bayes'],
    correct_answer: 'K-Means',
  },
  {
    question: 'Which learning type uses labelled data?',
    options: ['Supervised', 'Unsupervised', 'Clustering', 'Dimensionality reduction'],
    correct_answer: 'Supervised',
  },
  {
    question: 'What does regression usually predict?',
    options: ['A continuous value', 'A file type', 'A cluster label only', 'A database schema'],
    correct_answer: 'A continuous value',
  },
  {
    question: 'What is the purpose of a validation set?',
    options: ['Tune model choices', 'Store passwords', 'Create labels automatically', 'Replace training data'],
    correct_answer: 'Tune model choices',
  },
  {
    question: 'What does probability measure?',
    options: ['The likelihood of an event', 'The size of a dataset', 'The number of model layers', 'The speed of a processor'],
    correct_answer: 'The likelihood of an event',
  },
];

export const mockNotes = [
  {
    id: 'note-1',
    title: 'Machine Learning - Unit 1',
    file_name: 'Machine Learning - Unit 1.pdf',
    created_at: '2026-09-18T10:30:00Z',
    summary: 'Introduction to machine learning, supervised learning, unsupervised learning, regression, classification and clustering.',
    key_points: [
      'Machine learning learns patterns from data.',
      'Supervised learning uses labelled data.',
      'Unsupervised learning discovers hidden patterns.',
    ],
    definitions: [
      'Regression: predicting a continuous numeric outcome.',
      'Classification: assigning an input to a discrete category.',
      'Clustering: discovering groups in unlabelled data.',
    ],
    formulas: [
      'Mean squared error = average of (actual - predicted)^2',
      'Accuracy = correct predictions / total predictions',
    ],
    quiz: mockQuiz.slice(0, 3),
    video_script: 'Welcome to Machine Learning Unit 1. In this lesson, we will learn the basics of machine learning and its major types.',
  },
  {
    id: 'note-2',
    title: 'Operating Systems - Unit 4',
    file_name: 'Operating Systems - Unit 4.pdf',
    created_at: '2026-09-17T15:20:00Z',
    summary: 'Study material covering memory management, paging, page tables and virtual memory.',
    key_points: [
      'Paging divides memory into fixed-size pages.',
      'Page tables map virtual addresses to physical addresses.',
      'Virtual memory allows efficient memory management.',
    ],
    definitions: [
      'Paging: a memory-management scheme that divides memory into pages.',
      'Virtual memory: using storage to extend the apparent main memory.',
    ],
    formulas: ['Physical address = frame number + page offset'],
    quiz: [
      {
        question: 'What does a page table store?',
        options: ['CPU instructions', 'Virtual-to-physical address mappings', 'User passwords', 'File names'],
        correct_answer: 'Virtual-to-physical address mappings',
      },
    ],
    video_script: 'Welcome to Operating Systems Unit 4. This lesson explains paging, page tables and virtual memory.',
  },
  {
    id: 'note-3',
    title: 'Data Structures - Trees',
    file_name: 'Data Structures - Trees.pdf',
    created_at: '2026-09-16T09:15:00Z',
    summary: 'Introduction to trees, binary trees, binary search trees and tree traversal techniques.',
    key_points: [
      'A tree is a hierarchical data structure.',
      'Binary trees have at most two children per node.',
      'Traversal techniques include inorder, preorder and postorder.',
    ],
    definitions: [
      'Binary tree: a tree where each node has at most two children.',
      'Inorder traversal: visiting left subtree, node, then right subtree.',
    ],
    formulas: ['Maximum nodes at height h = 2^(h + 1) - 1'],
    quiz: [],
    video_script: 'Welcome to Data Structures. In this lesson, we will explore trees and different tree traversal techniques.',
  },
];

export const mockSkills = [
  { name: 'Regression', score: 90, status: 'Strong' },
  { name: 'Classification', score: 82, status: 'Strong' },
  { name: 'Probability', score: 61, status: 'Needs Improvement' },
  { name: 'Clustering', score: 52, status: 'Needs Improvement' },
];

export const mockRoadmap = [
  { title: 'Regression Basics', status: 'Completed', tone: 'completed' },
  { title: 'Probability', status: 'Current Focus', tone: 'current' },
  { title: 'K-Means Clustering', status: 'Recommended Next', tone: 'recommended' },
  { title: 'Hierarchical Clustering', status: 'Upcoming', tone: 'upcoming' },
];

export const mockCareerPaths = [
  { name: 'Data Analyst', match: 86, skills: 'SQL • Statistics • Visualization' },
  { name: 'Data Scientist', match: 78, skills: 'Python • Statistics • Machine Learning' },
  { name: 'ML Engineer', match: 71, skills: 'Python • ML • Model Deployment' },
];

export const mockAnalytics = {
  study_time_minutes: 755,
  notes_uploaded: 8,
  notes_completed: 5,
  average_quiz_score: 82,
  best_quiz_score: 95,
  weak_topics: ['Clustering', 'Probability', 'Page Tables'],
  strong_topics: ['Regression', 'Classification', 'Paging'],
  completion_percentage: 68,
  recent_activity: [
    { action: 'Completed ML Quiz', timestamp: '2026-09-19T11:30:00Z' },
    { action: 'Uploaded Machine Learning notes', timestamp: '2026-09-18T10:30:00Z' },
    { action: 'Reviewed Operating Systems notes', timestamp: '2026-09-17T15:20:00Z' },
  ],
};

const NOTES_KEY = 'scholarflow_mock_notes';

export function getMockNotes() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(NOTES_KEY) || 'null');
    return Array.isArray(stored) && stored.length ? stored : mockNotes;
  } catch {
    return mockNotes;
  }
}

export function saveMockNote(note) {
  const notes = [note, ...getMockNotes().filter((item) => item.id !== note.id)];
  sessionStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return notes;
}

import { useState } from 'react';
import api from '../services/api';

function UploadNotesCard({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setMessageType('error');
      setMessage('Please choose a PDF file first.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setMessageType('error');
      setMessage('Only PDF files are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessageType('error');
      setMessage('File is too large. Maximum size is 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setUploadProgress(10);
    setMessage('Uploading your study material...');
    setMessageType('info');

    try {
      const response = await api.post('/upload-note', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.max(10, Math.round((event.loaded * 60) / event.total)));
          }
        },
      });
      setUploadProgress(100);
      setMessageType('success');
      setMessage(response.data.message || 'Note uploaded successfully.');
      onUploadSuccess?.(response.data);
      setFile(null);
    } catch {
      setMessageType('error');
      setMessage('Unable to prepare this study material.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setMessage(droppedFile.name.toLowerCase().endsWith('.pdf') ? '' : 'Only PDF files are supported.');
      setMessageType('info');
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Upload Notes</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Upload a PDF and prepare your study pack</h3>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div
          onDragEnter={() => setDragActive(true)}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border border-dashed p-4 text-center text-sm transition ${dragActive ? 'border-primary bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
        >
          <p className="font-medium text-slate-700">Drop a PDF here or browse your files</p>
          <p className="mt-1 text-slate-500">Supports single PDF uploads up to 10MB</p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
          />
        </div>

        {uploading ? (
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-600">Uploading {uploadProgress}%</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </form>

      {message ? (
        <p className={`mt-4 text-sm ${messageType === 'error' ? 'text-red-600' : messageType === 'success' ? 'text-green-600' : 'text-slate-600'}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default UploadNotesCard;

function Navbar({ title = 'ScholarFlow AI' }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">Your AI study workspace</p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('scholarflow_token');
            window.location.href = '/login';
          }}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;

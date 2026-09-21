import { Link } from 'react-router-dom';

const links = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Notes', href: '/dashboard#recent-notes' },
  { name: 'Quiz', href: '/quiz' },
  { name: 'Analytics', href: '/dashboard#analytics' },
  { name: 'Learning Roadmap', href: '/dashboard#roadmap-section' },
  { name: 'Career Paths', href: '/dashboard#career-section' },
];

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 lg:block">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">ScholarFlow</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Student workspace</h2>
      </div>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;

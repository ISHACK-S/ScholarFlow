function RecentActivity({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item.detail}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {item.detail}
        </div>
      ))}
    </div>
  );
}

export default RecentActivity;

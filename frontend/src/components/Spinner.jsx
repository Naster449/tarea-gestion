export default function Spinner({ label = "Cargando…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
      <div className="h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

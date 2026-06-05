export default function PaginationBar({ meta, onChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-slate-600 dark:text-slate-400">
        Página {meta.page} de {meta.totalPages} · {meta.total} registros
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onChange(meta.page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onChange(meta.page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

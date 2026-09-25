export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Oldingi
      </button>
      <span>
        {page} / {totalPages} ({total.toLocaleString('uz-UZ')} ta)
      </span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Keyingi →
      </button>
    </div>
  );
}

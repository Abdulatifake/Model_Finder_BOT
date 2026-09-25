import { useState } from 'react';

export default function ModelFormModal({ initial, categories, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '',
    category: initial?.category ?? 'other',
    description: initial?.description ?? '',
    previewImageUrl: initial?.previewImageUrl?.startsWith('http') ? initial.previewImageUrl : '',
    sourceLink: initial?.sourceLink ?? '',
    tags: (initial?.tags ?? []).join(', '),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const hasLocalImage = initial && !initial.previewImageUrl.startsWith('http');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{initial ? 'Modelni tahrirlash' : "Yangi model qo'shish"}</h2>

        {initial && <img className="modal-preview" src={initial.previewImageUrl} alt="" />}

        <label>
          Nomi
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </label>

        <label>
          Kategoriya
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Rasm URL {hasLocalImage && <small>(bo'sh qoldirsangiz, joriy rasm qoladi)</small>}
          <input
            required={!initial}
            value={form.previewImageUrl}
            onChange={(e) => update('previewImageUrl', e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label>
          Tavsif
          <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </label>

        <label>
          Teglar (vergul bilan)
          <input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="sofa, velvet, modern" />
        </label>

        <label>
          Yuklab olish havolasi (ixtiyoriy)
          <input value={form.sourceLink} onChange={(e) => update('sourceLink', e.target.value)} placeholder="https://..." />
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Bekor qilish
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}

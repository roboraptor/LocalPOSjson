'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Category } from '@/types/db';
import * as Fa from 'react-icons/fa6';

export default function CategoriesSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ id: number | null; name: string; color: string; position: number | string }>({
    id: null,
    name: '',
    color: '#ffffff',
    position: '',
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
      // alert('Error loading categories'); // volitelně tiché selhání
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const method = form.id ? 'PUT' : 'POST';
    const body = JSON.stringify({
        ...form,
        position: Number(form.position) || 0,
    });

    try {
        const res = await fetch('/api/categories', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body,
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Operation failed');
        }
        setForm({ id: null, name: '', color: '#ffffff', position: '' });
        await loadCategories();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Opravdu smazat tuto kategorii?')) return;
    try {
        const res = await fetch('/api/categories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Delete failed');
        }
        await loadCategories();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = (category: Category) => {
    setForm({
        id: category.id,
        name: category.name,
        color: category.color || '#ffffff',
        position: category.position,
    });
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="mb-0">Správa kategorií</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-7">
            <h6>Existující kategorie</h6>
            {loading ? (
              <>
                <div className="card skeleton"></div>
                <div className="card skeleton"></div>
              </>
            ) : (
              <table className="table table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Barva</th>
                    <th>#</th>
                    <th style={{ width: 80 }}>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td>
                        <span style={{ backgroundColor: cat.color || 'transparent', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc', display: 'inline-block', minWidth: 30 }}>
                          &nbsp;
                        </span>
                      </td>
                      <td>{cat.position}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => handleEdit(cat)} title="Upravit"><Fa.FaPencil /></button>
                            <button className="btn btn-outline-danger" onClick={() => handleDelete(cat.id)} title="Smazat"><Fa.FaTrashCan /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="col-md-5">
            <div className="p-3 bg-light rounded border">
                <h6 className="mb-3">{form.id ? 'Upravit kategorii' : 'Nová kategorie'}</h6>
                <form onSubmit={handleSubmit}>
                <div className="mb-2">
                    <label htmlFor="catName" className="form-label small fw-bold">Název</label>
                    <input type="text" className="form-control" id="catName" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="row g-2 mb-2">
                    <div className="col-8">
                        <label htmlFor="catColor" className="form-label small fw-bold">Barva</label>
                        <input type="color" className="form-control form-control-color w-100" id="catColor" value={form.color || '#ffffff'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                    </div>
                    <div className="col-4">
                        <label htmlFor="catPos" className="form-label small fw-bold">Pozice</label>
                        <input type="number" className="form-control" id="catPos" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                    </div>
                </div>
                <div className="d-grid gap-2 mt-3">
                    <button type="submit" className="btn btn-primary">{form.id ? 'Uložit změny' : 'Přidat'}</button>
                    {form.id && <button type="button" className="btn btn-secondary" onClick={() => setForm({ id: null, name: '', color: '#ffffff', position: '' })}>Zrušit</button>}
                </div>
                </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

# Templates de CRUD Completo — System Fixer

Use estes templates para criar do zero qualquer recurso ausente.
Substituir [Recurso], [recurso], [recursos] pelo nome real (ex: Product, product, products).

---

## Backend — CRUD Completo

### Model (MongoDB/Mongoose)
**Arquivo:** `src/models/[Recurso].js`

```javascript
import mongoose from 'mongoose';

const [Recurso]Schema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true },
  active:      { type: Boolean, default: true, index: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

[Recurso]Schema.index({ name: 'text' }); // busca textual

export const [Recurso] = mongoose.model('[Recurso]', [Recurso]Schema);
```

---

### Service
**Arquivo:** `src/services/[Recurso]Service.js`

```javascript
import { [Recurso] } from '../models/[Recurso].js';

export const [Recurso]Service = {

  async findAll({ page = 1, limit = 20, search, sort = '-createdAt' } = {}) {
    const filter = { active: true };
    if (search) filter.$text = { $search: search };

    const [data, total] = await Promise.all([
      [Recurso].find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, 100))
        .populate('createdBy', 'name email')
        .lean(),
      [Recurso].countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },

  async findById(id) {
    const item = await [Recurso].findById(id)
      .populate('createdBy', 'name email')
      .lean();
    if (!item) throw Object.assign(new Error('[Recurso] não encontrado'), { status: 404 });
    return item;
  },

  async create(data, userId) {
    return [Recurso].create({ ...data, createdBy: userId });
  },

  async update(id, data) {
    const item = await [Recurso].findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!item) throw Object.assign(new Error('[Recurso] não encontrado'), { status: 404 });
    return item;
  },

  async remove(id) {
    const item = await [Recurso].findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
    if (!item) throw Object.assign(new Error('[Recurso] não encontrado'), { status: 404 });
    return item;
  },
};
```

---

### Controller
**Arquivo:** `src/controllers/[Recurso]Controller.js`

```javascript
import { [Recurso]Service } from '../services/[Recurso]Service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const [Recurso]Controller = {

  findAll: asyncHandler(async (req, res) => {
    const result = await [Recurso]Service.findAll(req.query);
    res.json({ success: true, ...result });
  }),

  findById: asyncHandler(async (req, res) => {
    const data = await [Recurso]Service.findById(req.params.id);
    res.json({ success: true, data });
  }),

  create: asyncHandler(async (req, res) => {
    const data = await [Recurso]Service.create(req.body, req.user._id);
    res.status(201).json({ success: true, data });
  }),

  update: asyncHandler(async (req, res) => {
    const data = await [Recurso]Service.update(req.params.id, req.body);
    res.json({ success: true, data });
  }),

  remove: asyncHandler(async (req, res) => {
    await [Recurso]Service.remove(req.params.id);
    res.json({ success: true, message: '[Recurso] removido com sucesso' });
  }),
};
```

---

### Routes
**Arquivo:** `src/routes/[recurso].routes.js`

```javascript
import { Router } from 'express';
import { [Recurso]Controller } from '../controllers/[Recurso]Controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate); // todas as rotas requerem autenticação

router.get('/',     [Recurso]Controller.findAll);
router.get('/:id',  [Recurso]Controller.findById);
router.post('/',    [Recurso]Controller.create);
router.put('/:id',  [Recurso]Controller.update);
router.delete('/:id', authorize('admin'), [Recurso]Controller.remove);

export default router;
```

**Registrar em** `src/routes/index.js`:
```javascript
import [recurso]Routes from './[recurso].routes.js';
router.use('/[recursos]', [recurso]Routes);
```

---

## Frontend — Componentes Completos

### Service de API
**Arquivo:** `src/services/[recurso]Service.js`

```javascript
import api from './api';

export const [recurso]Service = {
  getAll:    (params) => api.get('/[recursos]', { params }).then(r => r.data),
  getById:   (id) => api.get(`/[recursos]/${id}`).then(r => r.data.data),
  create:    (data) => api.post('/[recursos]', data).then(r => r.data.data),
  update:    (id, data) => api.put(`/[recursos]/${id}`, data).then(r => r.data.data),
  remove:    (id) => api.delete(`/[recursos]/${id}`).then(r => r.data),
};
```

---

### Hook de Listagem
**Arquivo:** `src/hooks/use[Recursos].js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import { [recurso]Service } from '../services/[recurso]Service';

export const use[Recursos] = (initialParams = {}) => {
  const [data, setData]           = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [params, setParams]       = useState({ page: 1, limit: 20, ...initialParams });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await [recurso]Service.getAll(params);
      setData(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, pagination, loading, error, params, setParams, refetch: fetch };
};
```

---

### Página de Listagem
**Arquivo:** `src/pages/[Recursos]Page.jsx`

```jsx
import { useState } from 'react';
import { use[Recursos] } from '../hooks/use[Recursos]';
import { [recurso]Service } from '../services/[recurso]Service';
import [Recurso]Form from '../components/[Recurso]Form';

export default function [Recursos]Page() {
  const { data, pagination, loading, error, setParams, refetch } = use[Recursos]();
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selected) {
        await [recurso]Service.update(selected._id, formData);
      } else {
        await [recurso]Service.create(formData);
      }
      setShowForm(false);
      setSelected(null);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza?')) return;
    try {
      await [recurso]Service.remove(id);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao remover');
    }
  };

  if (loading) return <div className="text-center py-12">Carregando...</div>;
  if (error)   return <div className="text-red-500 p-4">Erro: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">[Recursos]</h1>
        <button
          onClick={() => { setSelected(null); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Novo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">
              {selected ? 'Editar' : 'Novo'} [Recurso]
            </h2>
            <[Recurso]Form
              initial={selected}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setSelected(null); }}
              saving={saving}
            />
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum [recurso] encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Criado em</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      onClick={() => { setSelected(item); setShowForm(true); }}
                      className="text-blue-600 hover:underline text-xs"
                    >Editar</button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:underline text-xs"
                    >Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >← Anterior</button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNext}
            onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >Próximo →</button>
        </div>
      )}
    </div>
  );
}
```

---

### Formulário Genérico
**Arquivo:** `src/components/[Recurso]Form.jsx`

```jsx
import { useState, useEffect } from 'react';

export default function [Recurso]Form({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) setForm({ name: initial.name || '', description: initial.description || '' });
  }, [initial]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className={`w-full border rounded px-3 py-2 ${errors.name ? 'border-red-500' : ''}`}
          placeholder="Nome do [recurso]"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border rounded px-3 py-2 h-24 resize-none"
          placeholder="Descrição opcional"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
        >Cancelar</button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
```

# Templates de Frontend — System Builder

Componentes React prontos para copiar e adaptar.

---

## 📁 src/services/api.js

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Interceptor: adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: tratar erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📁 src/hooks/useAuth.js

```javascript
import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 📁 src/components/PrivateRoute.jsx

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading, isAuth } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  if (!isAuth) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default PrivateRoute;
```

---

## 📁 src/App.jsx

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## 📁 src/hooks/useFetch.js

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useFetch = (endpoint, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, deps);

  return { data, loading, error, refetch: fetchData };
};
```

---

## 📁 src/components/ui/DataTable.jsx

```jsx
import { useState } from 'react';

const DataTable = ({ columns, data, onEdit, onDelete, loading }) => {
  const [search, setSearch] = useState('');

  const filtered = data?.filter(item =>
    Object.values(item).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  ) || [];

  if (loading) return <div className="text-center py-8">Carregando...</div>;

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border rounded px-3 py-2 w-full max-w-xs"
      />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-700">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row._id || i} className="border-b hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-gray-600">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right space-x-2">
                  {onEdit && <button onClick={() => onEdit(row)} className="text-blue-600 hover:underline text-xs">Editar</button>}
                  {onDelete && <button onClick={() => onDelete(row._id)} className="text-red-600 hover:underline text-xs">Excluir</button>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="text-center py-8 text-gray-400">Nenhum resultado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
```

---

## 📁 package.json (Frontend)

```json
{
  "name": "nome-do-sistema-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

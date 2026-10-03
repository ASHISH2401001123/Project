import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false);
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const finish = ({ data }) => { localStorage.setItem('token', data.token); setUser(data.user); return data.user; };
  const login = (body) => api.post('/auth/login', body).then(finish);
  const register = (body) => api.post('/auth/register', body).then(finish);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

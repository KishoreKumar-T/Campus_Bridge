import { createContext, useContext, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('cb_user') || 'null'));

  const save = (data) => {
    if (data && data.token && data.user) {
      localStorage.setItem('cb_token', data.token);
      localStorage.setItem('cb_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const login = async (email, password) => save(await api('auth/login', { method: 'POST', body: { email, password } }));
  const register = async (data) => save(await api('auth/register', { method: 'POST', body: data }));
  const logout = async () => {
    try { await api('auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    localStorage.removeItem('cb_token');
    localStorage.removeItem('cb_user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

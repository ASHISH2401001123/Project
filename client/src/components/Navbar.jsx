import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

function Bell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => api.get('/notifications').then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  const unread = items.filter((n) => !n.read).length;
  const toggle = async () => {
    setOpen(!open);
    if (!open && unread) { await api.put('/notifications/read-all'); setTimeout(load, 1500); }
  };
  return (
    <div className="relative">
      <button onClick={toggle} className="btn-ghost relative" aria-label="Notifications">
        Notifications
        {unread > 0 && <span className="ml-2 rounded-full bg-punch px-1.5 text-xs text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-auto rounded-lg border border-ink/10 bg-white p-2 shadow-lg">
          {items.length === 0 && <p className="p-3 text-sm text-ink/60">Nothing yet. Register for an event to get updates.</p>}
          {items.map((n) => (
            <div key={n._id} className={`rounded-md p-3 text-sm ${n.read ? '' : 'bg-signal/5'}`}>
              <p className="font-medium">{n.title}</p>
              <p className="text-ink/70">{n.message}</p>
              <p className="mt-1 text-xs text-ink/40">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="border-b border-ink/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-extrabold tracking-tight">Evently</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/" className="hover:underline">Browse events</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:underline">Dashboard</Link>
              <Bell />
              <span className="hidden text-ink/60 sm:inline">{user.name} ({user.role})</span>
              <button className="btn-ghost" onClick={() => { logout(); nav('/login'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/signup" className="btn-primary">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

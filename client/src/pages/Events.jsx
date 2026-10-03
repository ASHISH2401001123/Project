import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import Msg from '../components/Msg';

const tag = { technical: 'bg-signal/10 text-signal', workshop: 'bg-emerald-100 text-emerald-700', hackathon: 'bg-punch/10 text-punch' };

export default function Events() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [msg, setMsg] = useState(null);

  const load = () => api.get('/events').then((r) => setEvents(r.data));
  useEffect(() => { load(); }, []);

  const register = async (id) => {
    if (!user) return nav('/login');
    try { await api.post(`/registrations/event/${id}`); setMsg({ type: 'ok', text: 'Registered! Find your QR ticket in your dashboard.' }); load(); }
    catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };

  const shown = events.filter((e) => (!type || e.type === type) && e.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <h1 className="mb-1 text-4xl font-extrabold">Upcoming events</h1>
      <p className="mb-6 text-ink/60">Workshops, technical talks and hackathons. Register in one click and get a QR ticket.</p>
      <Msg msg={msg} />
      <div className="mb-6 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search events" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[12rem]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option><option value="technical">Technical</option><option value="workshop">Workshop</option><option value="hackathon">Hackathon</option>
        </select>
      </div>
      {shown.length === 0 && <p className="card text-ink/60">No events found. Organizers can publish one from their dashboard.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((e) => {
          const left = e.capacity - e.registered;
          return (
            <article key={e._id} className="card flex flex-col">
              <span className={`mb-3 w-fit rounded px-2 py-0.5 text-xs font-medium ${tag[e.type]}`}>{e.type}</span>
              <h2 className="text-lg font-bold">{e.title}</h2>
              <p className="mt-1 line-clamp-3 flex-1 text-sm text-ink/70">{e.description}</p>
              <p className="mt-3 text-sm">{new Date(e.date).toLocaleString()}</p>
              <p className="text-sm text-ink/60">{e.venue} · by {e.organizer?.name}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm">{left > 0 ? `${left} seats left` : 'Full'}</span>
                {(!user || user.role === 'participant') && <button className="btn-primary" disabled={left <= 0} onClick={() => register(e._id)}>Register</button>}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

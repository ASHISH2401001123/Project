import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../api';
import Msg from '../components/Msg';

const blank = { title: '', description: '', type: 'technical', date: '', venue: '', capacity: 100 };

export default function Organizer() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(null); // { id, regs, feedback }
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const ok = (text) => setMsg({ type: 'ok', text });
  const bad = (e) => setMsg({ type: 'error', text: errMsg(e) });

  const load = () => {
    api.get('/events/mine').then((r) => setEvents(r.data));
    api.get('/analytics/organizer').then((r) => setStats(r.data));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      editing ? await api.put(`/events/${editing}`, form) : await api.post('/events', form);
      ok(editing ? 'Event updated' : 'Event published'); setForm(blank); setEditing(null); load();
    } catch (err) { bad(err); }
  };

  const edit = (ev) => { setEditing(ev._id); setForm({ title: ev.title, description: ev.description || '', type: ev.type, date: ev.date.slice(0, 16), venue: ev.venue, capacity: ev.capacity }); window.scrollTo(0, 0); };
  const remove = async (id) => { if (confirm('Delete this event and all its registrations?')) { await api.delete(`/events/${id}`); load(); } };

  const details = async (id) => {
    if (open?.id === id) return setOpen(null);
    const [regs, fb] = await Promise.all([api.get(`/registrations/event/${id}`), api.get(`/feedback/event/${id}`)]);
    setOpen({ id, regs: regs.data, feedback: fb.data });
  };

  const addVolunteer = async (id) => {
    const email = prompt('Volunteer email (they must have a volunteer account):'); if (!email) return;
    try { ok((await api.post(`/events/${id}/volunteers`, { email })).data.message); load(); } catch (err) { bad(err); }
  };

  const broadcast = async (id) => {
    const message = prompt('Message to all registered participants:'); if (!message) return;
    try { ok((await api.post(`/notifications/broadcast/${id}`, { message })).data.message); } catch (err) { bad(err); }
  };

  const exportCsv = (id, title) => {
    const rows = [['Name', 'Email', 'Registered', 'Attended'], ...open.regs.map((r) => [r.user.name, r.user.email, new Date(r.createdAt).toISOString(), r.attended ? 'Yes' : 'No'])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = `${title}-participants.csv`; a.click();
  };

  const t = stats?.totals;
  return (
    <>
      <h1 className="mb-6 text-3xl font-extrabold">Organizer dashboard</h1>
      <Msg msg={msg} />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['Events', t?.events], ['Registrations', t?.registered], ['Checked in', t?.attended], ['Attendance rate', t ? `${t.attendanceRate}%` : '']].map(([l, v]) => (
          <div key={l} className="card"><p className="text-3xl font-extrabold">{v ?? 0}</p><p className="text-sm text-ink/60">{l}</p></div>
        ))}
      </div>

      {stats?.perEvent.length > 0 && (
        <section className="card mb-8">
          <h2 className="mb-3 font-bold">Registrations vs attendance</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={stats.perEvent}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="title" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                <Bar dataKey="registered" name="Registered" fill="#2f5bea" /><Bar dataKey="attended" name="Attended" fill="#ff5d3a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="card mb-8">
        <h2 className="mb-3 font-bold">{editing ? 'Edit event' : 'Create an event'}</h2>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <input className="input" placeholder="Title" value={form.title} onChange={set('title')} required />
          <select className="input" value={form.type} onChange={set('type')}><option value="technical">Technical event</option><option value="workshop">Workshop</option><option value="hackathon">Hackathon</option></select>
          <input type="datetime-local" className="input" value={form.date} onChange={set('date')} required />
          <input className="input" placeholder="Venue" value={form.venue} onChange={set('venue')} required />
          <input type="number" min="1" className="input" placeholder="Capacity" value={form.capacity} onChange={set('capacity')} />
          <textarea className="input md:col-span-2" placeholder="Description" value={form.description} onChange={set('description')} />
          <div className="flex gap-2 md:col-span-2">
            <button className="btn-primary">{editing ? 'Save changes' : 'Publish event'}</button>
            {editing && <button type="button" className="btn-ghost" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</button>}
          </div>
        </form>
      </section>

      <h2 className="mb-3 font-bold">Your events</h2>
      {events.length === 0 && <p className="card text-ink/60">No events yet. Use the form above to publish your first one.</p>}
      <div className="space-y-4">
        {events.map((ev) => {
          const s = stats?.perEvent.find((x) => x.id === ev._id);
          return (
            <div key={ev._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{ev.title} <span className="text-sm font-normal text-ink/50">({ev.type})</span></h3>
                  <p className="text-sm text-ink/60">{new Date(ev.date).toLocaleString()} · {ev.venue}</p>
                  <p className="mt-1 text-sm">{s?.registered ?? 0}/{ev.capacity} registered · {s?.attended ?? 0} attended · {s?.avgRating ? `${s.avgRating}/5 from ${s.feedbackCount} reviews` : 'no feedback yet'}</p>
                  <p className="text-sm text-ink/60">Volunteers: {ev.volunteers.length ? ev.volunteers.map((v) => v.name).join(', ') : 'none'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-ghost" onClick={() => details(ev._id)}>{open?.id === ev._id ? 'Hide details' : 'Participants & feedback'}</button>
                  <button className="btn-ghost" onClick={() => addVolunteer(ev._id)}>Add volunteer</button>
                  <button className="btn-ghost" onClick={() => broadcast(ev._id)}>Notify</button>
                  <button className="btn-ghost" onClick={() => edit(ev)}>Edit</button>
                  <button className="btn-danger" onClick={() => remove(ev._id)}>Delete</button>
                </div>
              </div>
              {open?.id === ev._id && (
                <div className="mt-4 grid gap-6 border-t border-ink/10 pt-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between"><h4 className="font-medium">Participants ({open.regs.length})</h4>
                      {open.regs.length > 0 && <button className="btn-ghost" onClick={() => exportCsv(ev._id, ev.title)}>Export CSV</button>}</div>
                    <ul className="max-h-60 divide-y divide-ink/10 overflow-auto text-sm">
                      {open.regs.map((r) => <li key={r._id} className="flex justify-between py-1.5"><span>{r.user.name}</span><span className={r.attended ? 'text-emerald-700' : 'text-ink/40'}>{r.attended ? 'Attended' : 'Registered'}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Feedback ({open.feedback.length})</h4>
                    <ul className="max-h-60 space-y-2 overflow-auto text-sm">
                      {open.feedback.length === 0 && <li className="text-ink/50">No feedback yet.</li>}
                      {open.feedback.map((f) => <li key={f._id}><b>{f.rating}/5</b> {f.user?.name}: {f.comment}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api, { errMsg } from '../api';
import Msg from '../components/Msg';

export default function Volunteer() {
  const [events, setEvents] = useState([]);
  const [sel, setSel] = useState(null);
  const [list, setList] = useState([]);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const busy = useRef(false);
  const selRef = useRef(null);

  useEffect(() => { api.get('/events/mine').then((r) => { setEvents(r.data); if (r.data[0]) pick(r.data[0]._id); }); }, []);

  const pick = (id) => { setSel(id); selRef.current = id; api.get(`/registrations/event/${id}`).then((r) => setList(r.data)); };

  const checkIn = async (ticketCode) => {
    if (busy.current) return; busy.current = true;
    try {
      const r = await api.post('/attendance/scan', { ticketCode });
      setMsg({ type: 'ok', text: r.data.message }); setCode('');
      if (selRef.current) pick(selRef.current);
    } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    setTimeout(() => (busy.current = false), 1500);
  };

  useEffect(() => {
    const s = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 220 }, false);
    s.render((text) => checkIn(text), () => {});
    return () => { s.clear().catch(() => {}); };
  }, []);

  const attended = list.filter((r) => r.attended).length;

  return (
    <>
      <h1 className="mb-6 text-3xl font-extrabold">Check-in desk</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-bold">Scan a ticket</h2>
          <Msg msg={msg} />
          <div id="qr-reader" />
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); checkIn(code); }}>
            <input className="input" placeholder="Or type the ticket code" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn-primary">Check in</button>
          </form>
        </section>
        <section className="card">
          <h2 className="mb-3 font-bold">Attendees</h2>
          {events.length === 0 ? <p className="text-ink/60">You haven't been assigned to an event yet. Ask an organizer to add your email.</p> : (
            <>
              <select className="input mb-3" value={sel || ''} onChange={(e) => pick(e.target.value)}>
                {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
              </select>
              <p className="mb-2 text-sm text-ink/60">{attended} of {list.length} checked in</p>
              <ul className="max-h-96 divide-y divide-ink/10 overflow-auto text-sm">
                {list.map((r) => (
                  <li key={r._id} className="flex justify-between py-2">
                    <span>{r.user.name} <span className="text-ink/50">{r.user.email}</span></span>
                    <span className={r.attended ? 'text-emerald-700' : 'text-ink/40'}>{r.attended ? 'In' : 'Waiting'}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}

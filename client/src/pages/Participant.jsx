import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import Msg from '../components/Msg';

function Feedback({ eventId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState(null);
  const send = async () => {
    try { await api.post(`/feedback/event/${eventId}`, { rating, comment }); onDone('Thanks for your feedback!'); }
    catch (e) { setErr({ type: 'error', text: errMsg(e) }); }
  };
  return (
    <div className="mt-3 space-y-2 rounded-md bg-paper p-3">
      <Msg msg={err} />
      <label className="text-sm">Rating
        <select className="input mt-1" value={rating} onChange={(e) => setRating(+e.target.value)}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select>
      </label>
      <textarea className="input" placeholder="What worked, what didn't?" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn-primary" onClick={send}>Send feedback</button>
    </div>
  );
}

export default function Participant() {
  const [regs, setRegs] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [fbFor, setFbFor] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => api.get('/registrations/mine').then((r) => setRegs(r.data));
  useEffect(() => { load(); }, []);

  const showTicket = async (id) => setTicket((await api.get(`/registrations/${id}/ticket`)).data);

  const certificate = async (id) => {
    try {
      const r = await api.get(`/registrations/${id}/certificate`, { responseType: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = 'certificate.pdf'; a.click();
    } catch (e) { setMsg({ type: 'error', text: 'Certificate not available yet' }); }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this registration?')) return;
    try { await api.delete(`/registrations/${id}`); setMsg({ type: 'ok', text: 'Registration cancelled' }); load(); }
    catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };

  return (
    <>
      <h1 className="mb-6 text-3xl font-extrabold">My events</h1>
      <Msg msg={msg} />
      {regs.length === 0 && <p className="card text-ink/60">You haven't registered for anything yet. Browse events to get your first ticket.</p>}
      <div className="grid gap-5 md:grid-cols-2">
        {regs.map((r) => (
          <div key={r._id} className="card">
            <h2 className="font-bold">{r.event?.title}</h2>
            <p className="text-sm text-ink/60">{r.event && new Date(r.event.date).toLocaleString()} · {r.event?.venue}</p>
            <p className="mt-2 text-sm">{r.attended ? <span className="text-emerald-700">Checked in</span> : 'Not checked in yet'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-ghost" onClick={() => showTicket(r._id)}>View ticket</button>
              {r.attended && <button className="btn-primary" onClick={() => certificate(r._id)}>Download certificate</button>}
              {r.attended && <button className="btn-ghost" onClick={() => setFbFor(fbFor === r._id ? null : r._id)}>Give feedback</button>}
              {!r.attended && <button className="btn-danger" onClick={() => cancel(r._id)}>Cancel</button>}
            </div>
            {fbFor === r._id && <Feedback eventId={r.event._id} onDone={(t) => { setFbFor(null); setMsg({ type: 'ok', text: t }); }} />}
          </div>
        ))}
      </div>

      {ticket && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/50 p-4" onClick={() => setTicket(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-ink/60">Admit one</p>
            <h2 className="text-xl font-extrabold">{ticket.event.title}</h2>
            <p className="text-sm">{ticket.user.name}</p>
            <div className="my-4 border-y border-dashed border-ink/30 py-4">
              <img src={ticket.qr} alt="Ticket QR code" className="mx-auto h-56 w-56" />
              <p className="mt-2 break-all font-mono text-xs text-ink/60">{ticket.ticketCode}</p>
            </div>
            <p className="text-sm">{new Date(ticket.event.date).toLocaleString()} · {ticket.event.venue}</p>
            <div className="mt-4 flex justify-center gap-2">
              <a className="btn-primary" href={ticket.qr} download="ticket-qr.png">Save QR</a>
              <button className="btn-ghost" onClick={() => window.print()}>Print</button>
              <button className="btn-ghost" onClick={() => setTicket(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

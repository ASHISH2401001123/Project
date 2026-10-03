import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errMsg } from '../api';
import Msg from '../components/Msg';

export default function Auth({ mode }) {
  const signup = mode === 'signup';
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'participant' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try { await (signup ? register(f) : login(f)); nav('/dashboard'); }
    catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-3xl font-extrabold">{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mb-6 text-ink/60">{signup ? 'Join events, run check-ins, or organize your own.' : 'Log in to see your tickets and events.'}</p>
      <form onSubmit={submit} className="card space-y-4">
        <Msg msg={msg} />
        {signup && <label className="block text-sm">Full name<input className="input mt-1" value={f.name} onChange={set('name')} required /></label>}
        <label className="block text-sm">Email<input type="email" className="input mt-1" value={f.email} onChange={set('email')} required /></label>
        <label className="block text-sm">Password<input type="password" minLength={6} className="input mt-1" value={f.password} onChange={set('password')} required /></label>
        {signup && (
          <label className="block text-sm">I am a
            <select className="input mt-1" value={f.role} onChange={set('role')}>
              <option value="participant">Participant</option>
              <option value="volunteer">Volunteer</option>
              <option value="organizer">Organizer</option>
            </select>
          </label>
        )}
        <button className="btn-primary w-full">{signup ? 'Create account' : 'Log in'}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        {signup ? <>Already registered? <Link className="text-signal underline" to="/login">Log in</Link></> : <>New here? <Link className="text-signal underline" to="/signup">Create an account</Link></>}
      </p>
    </div>
  );
}

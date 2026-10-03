import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Events from './pages/Events';
import Participant from './pages/Participant';
import Volunteer from './pages/Volunteer';
import Organizer from './pages/Organizer';

function Dashboard() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Loading…</p>;
  if (!user) return <Navigate to="/login" />;
  return { organizer: <Organizer />, volunteer: <Volunteer />, participant: <Participant /> }[user.role];
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

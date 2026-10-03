export default function Msg({ msg }) {
  if (!msg) return null;
  const bad = msg.type === 'error';
  return (
    <p role="status" className={`mb-4 rounded-md px-3 py-2 text-sm ${bad ? 'bg-punch/10 text-punch' : 'bg-emerald-50 text-emerald-700'}`}>
      {msg.text}
    </p>
  );
}

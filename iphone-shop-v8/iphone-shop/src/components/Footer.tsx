export default function Footer({ text, email, name }: { text: string | null; email: string | null; name: string }) {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span>© {new Date().getFullYear()} {name}{text ? ` — ${text}` : ''}</span>
        {email && <a href={`mailto:${email}`}>{email}</a>}
      </div>
    </footer>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-light)] px-4 py-8">
      {/* Subtle top brand bar */}
      <div className="w-full max-w-md mb-6">
        <a
          href="/"
          className="flex items-center justify-center gap-2.5 text-navy hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 gradient-navy rounded-xl flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
              <path d="M10 6h4" />
              <path d="M10 10h4" />
              <path d="M10 14h4" />
              <path d="M10 18h4" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            بزنس إنفو
          </span>
        </a>
      </div>
      {children}
      {/* Subtle footer */}
      <div className="w-full max-w-md mt-6 text-center text-xs text-[var(--text-secondary)]">
        <p>&copy; {new Date().getFullYear()} بزنس إنفو. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
}

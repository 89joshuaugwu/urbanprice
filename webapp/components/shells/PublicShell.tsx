"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { onAuthChange, logOut } from "@/lib/auth";
import { firebaseEnabled } from "@/lib/firebase";
import type { User } from "firebase/auth";

const NAV_LINKS = [
  { href: "/valuate", label: "Valuate" },
  { href: "/methodology", label: "Methodology" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthChange(setUser);
    return unsub;
  }, []);

  // React-recommended "reset state when a prop changes" pattern — done
  // during render via a tracked previous value, not in a useEffect (an
  // effect here would trigger a synchronous cascading re-render, which
  // is exactly the anti-pattern React's own docs warn against).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const linkClass =
    "block rounded-lg px-3 py-3 text-sm font-medium text-up-text-primary hover:bg-slate-100 md:py-2";

  return (
    // min-h-screen (not min-h-full) so this doesn't depend on every
    // ancestor having an explicit height — that chain broke on the
    // history/auth pages and left the footer floating mid-page instead
    // of pinned to the bottom of short content.
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-up-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" alt="UrbanPrice logo" width={32} height={32} priority />
            <span className="font-display truncate text-lg font-semibold text-up-primary">
              UrbanPrice
            </span>
          </Link>

          {/* Desktop nav — hidden below md, so it never has to squeeze
              against the logo on phone-width screens. */}
          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            {firebaseEnabled && user && (
              <Link href="/history" className={linkClass}>
                History
              </Link>
            )}
            {firebaseEnabled && (
              <>
                {user ? (
                  <button
                    onClick={() => logOut()}
                    className="ml-1 rounded-lg bg-up-primary px-3 py-2 text-white hover:bg-slate-800"
                  >
                    Log out
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="ml-1 rounded-lg bg-up-primary px-3 py-2 text-white hover:bg-slate-800"
                  >
                    Log in
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Mobile hamburger — visible only below md. */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-up-primary hover:bg-slate-100 md:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile dropdown panel */}
        {menuOpen && (
          <nav className="border-t border-up-border bg-white px-4 py-2 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            {firebaseEnabled && user && (
              <Link href="/history" className={linkClass}>
                History
              </Link>
            )}
            {firebaseEnabled && (
              <div className="mt-2 border-t border-up-border pt-2">
                {user ? (
                  <button
                    onClick={() => logOut()}
                    className="w-full rounded-lg bg-up-primary px-3 py-3 text-center font-medium text-white hover:bg-slate-800"
                  >
                    Log out
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="block w-full rounded-lg bg-up-primary px-3 py-3 text-center font-medium text-white hover:bg-slate-800"
                  >
                    Log in
                  </Link>
                )}
              </div>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-up-border bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-up-text-secondary">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="UrbanPrice logo" width={20} height={20} />
            <span className="font-medium text-up-text-primary">UrbanPrice</span>
          </div>
          <p className="mt-2 max-w-2xl">
            An automated valuation model built on ensembled regression trees, trained and
            validated on real Nigerian property listings across 25 states. See{" "}
            <Link href="/methodology" className="underline hover:text-up-primary">
              Methodology
            </Link>{" "}
            for the full disclosure.
          </p>
        </div>
      </footer>
    </div>
  );
}

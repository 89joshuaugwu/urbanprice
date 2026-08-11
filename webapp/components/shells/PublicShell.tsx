"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthChange, logOut } from "@/lib/auth";
import { firebaseEnabled } from "@/lib/firebase";
import type { User } from "firebase/auth";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthChange(setUser);
    return unsub;
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-up-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="UrbanPrice logo" width={36} height={36} priority />
            <span className="font-display text-lg font-semibold text-up-primary">
              UrbanPrice
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link
              href="/valuate"
              className="rounded-lg px-3 py-2 text-up-text-primary hover:bg-slate-100"
            >
              Valuate
            </Link>
            <Link
              href="/methodology"
              className="rounded-lg px-3 py-2 text-up-text-primary hover:bg-slate-100"
            >
              Methodology
            </Link>
            {firebaseEnabled && user && (
              <Link
                href="/history"
                className="rounded-lg px-3 py-2 text-up-text-primary hover:bg-slate-100"
              >
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
        </div>
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
            validated against an established housing benchmark dataset. See{" "}
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

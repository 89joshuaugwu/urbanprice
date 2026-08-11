"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { logIn, logInWithGoogle } from "@/lib/auth";
import { firebaseEnabled } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!firebaseEnabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-up-primary">Login unavailable</h1>
        <p className="mt-3 text-up-text-secondary">
          This deployment doesn&apos;t have Firebase configured, so login and saved
          history aren&apos;t enabled.{" "}
          <Link href="/valuate" className="underline hover:text-up-primary">
            You can still use the valuation tool
          </Link>{" "}
          without an account.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await logIn(email, password);
      Toast.success("Welcome back.");
      router.push("/valuate");
    } catch (err) {
      Toast.error(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-up-primary">Log in</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={loading}>
          Log in
        </Button>
      </form>
      <Button
        variant="secondary"
        className="mt-3 w-full"
        onClick={async () => {
          try {
            await logInWithGoogle();
            router.push("/valuate");
          } catch (err) {
            Toast.error(err instanceof Error ? err.message : "Google login failed.");
          }
        }}
      >
        Continue with Google
      </Button>
      <p className="mt-6 text-center text-sm text-up-text-secondary">
        No account?{" "}
        <Link href="/auth/signup" className="font-medium text-up-primary underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

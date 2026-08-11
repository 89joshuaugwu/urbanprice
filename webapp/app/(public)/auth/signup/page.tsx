"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { signUp } from "@/lib/auth";
import { firebaseEnabled } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!firebaseEnabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-up-primary">Sign up unavailable</h1>
        <p className="mt-3 text-up-text-secondary">
          This deployment doesn&apos;t have Firebase configured, so accounts aren&apos;t
          enabled.{" "}
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
      await signUp(email, password);
      Toast.success("Account created.");
      router.push("/valuate");
    } catch (err) {
      Toast.error(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-up-primary">Sign up</h1>
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-up-text-secondary">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-up-primary underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

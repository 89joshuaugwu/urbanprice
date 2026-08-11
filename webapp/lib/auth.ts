"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, firebaseEnabled } from "@/lib/firebase";

class AuthNotConfiguredError extends Error {
  constructor() {
    super(
      "Login is not configured for this deployment. Set the NEXT_PUBLIC_FIREBASE_* environment variables to enable it (see README.md)."
    );
    this.name = "AuthNotConfiguredError";
  }
}

function requireAuth() {
  if (!firebaseEnabled || !auth) throw new AuthNotConfiguredError();
  return auth;
}

export async function signUp(email: string, password: string) {
  const a = requireAuth();
  return createUserWithEmailAndPassword(a, email, password);
}

export async function logIn(email: string, password: string) {
  const a = requireAuth();
  return signInWithEmailAndPassword(a, email, password);
}

export async function logInWithGoogle() {
  const a = requireAuth();
  return signInWithPopup(a, new GoogleAuthProvider());
}

export async function logOut() {
  const a = requireAuth();
  return signOut(a);
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!firebaseEnabled || !auth) {
    // No Firebase configured: immediately report "logged out" and never fire again.
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

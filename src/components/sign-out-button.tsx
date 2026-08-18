"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    // End the Auth.js session without letting it choose a redirect URL.
    await signOut({
      redirect: false,
    });

    // Redirect relative to the website currently open.
    // On Vercel this becomes:
    // https://gradconnect-sepia.vercel.app/login
    window.location.assign("/login");
  }

  return (
    <button
      type="button"
      className="nav-link"
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut size={18} />
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
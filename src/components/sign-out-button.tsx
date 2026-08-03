"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
export function SignOutButton() {
  return <button className="nav-link" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={18}/> Sign out</button>;
}

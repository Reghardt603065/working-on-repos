"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BriefcaseBusiness, ListChecks, Award, Trophy, FolderKanban, Users, MessageCircle, Bell, UserRound, Settings } from "lucide-react";

const links = [
  ["/dashboard", "Dashboard", LayoutDashboard], ["/jobs", "Jobs", BriefcaseBusiness],
  ["/applications", "Applications", ListChecks], ["/certifications", "Certifications", Award], ["/hackathons", "Hackathons", Trophy],
  ["/portfolio", "Portfolio", FolderKanban], ["/peers", "Peers & goals", Users],
  ["/messages", "Messages", MessageCircle], ["/notifications", "Notifications", Bell],
  ["/profile", "Profile", UserRound], ["/settings", "Settings", Settings],
] as const;

export function AppNav() {
  const pathname = usePathname();
  return <nav className="nav-list" aria-label="Main navigation">{links.map(([href,label,Icon]) => <Link key={href} href={href} className={`nav-link ${pathname === href ? "active" : ""}`}><Icon size={18}/>{label}</Link>)}</nav>;
}

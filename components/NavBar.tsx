"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Capture" },
  { href: "/archive", label: "Archive" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#241F14] border-t border-[#3a3324] flex justify-center">
      <div className="flex w-full max-w-2xl">
        {tabs.map((t) => {
          const active =
            pathname === t.href ||
            (t.href === "/archive" && pathname.startsWith("/archive"));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-1 text-center py-3 text-sm uppercase tracking-wide ${
                active ? "text-amber border-t-2 border-amber" : "text-[#8a8170]"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from 'next/image';
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OwnerDesksPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const desks = await prisma.desk.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: { photos: { take: 1, orderBy: { order: 'asc' } } },
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-12 md:py-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              My desks
            </h1>
            <p className="text-sm text-foreground/70">
              Manage the workspaces you&apos;ve listed on Deskday.
            </p>
          </div>
          <Link
            href="/dashboard/owner/desks/new"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
          >
            Create listing
          </Link>
        </div>

        {desks.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/70 p-6 text-sm text-foreground/70">
            No desks yet. Click &quot;Create listing&quot; to add your first desk.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {desks.map((desk) => (
              <div
                key={desk.id}
                className="bg-card rounded-2xl border border-border/70 p-4 shadow-soft/40"
              >
                {desk.photos?.[0] && (
                  <div className="mb-3 w-full h-36 rounded overflow-hidden border border-border/80 relative">
                    <Image src={desk.photos[0].thumbnailUrl ?? desk.photos[0].url} alt={desk.title_en ?? 'desk photo'} fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold">{desk.title_en || "Desk"}</h2>
                  <Link
                    href={`/dashboard/owner/desks/${desk.id}/edit`}
                    className="text-xs rounded px-2 py-1 border border-border/70 hover:bg-background/50 flex items-center gap-1"
                    aria-label="Edit desk"
                    title="Edit desk"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                </div>
                <p className="text-xs text-foreground/60 mb-2">
                  {desk.city}, {desk.country}
                </p>
                <p className="text-sm font-semibold mb-3">
                  {desk.pricePerDay / 100} {desk.currency} / day
                </p>
                <p className="text-[11px] text-foreground/40">
                  Listing ID: {desk.id}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

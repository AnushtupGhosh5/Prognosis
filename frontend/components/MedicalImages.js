"use client";

import { useMemo } from "react";

export default function MedicalImages({ sessionId, caseData }) {
  const sources = useMemo(() => {
    const list = [];

    const withExts = (baseNoExt) => [
      `${baseNoExt}.png`,
      `${baseNoExt}.jpg`,
      `${baseNoExt}.jpeg`,
    ];

    // 1) If the API provides image URLs, only accept ones inside /images/cases
    const fromCase = Array.isArray(caseData?.images)
      ? caseData.images
      : caseData?.image
      ? [caseData.image]
      : [];
    list.push(
      ...fromCase.filter((p) => typeof p === 'string' && p.startsWith('/images/cases/'))
    );

    // 2) Case-scoped fallbacks in public/images/cases/{caseKey}/
    const slugify = (s) =>
      (s || "")
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const caseKey =
      caseData?.id ||
      caseData?.case_id ||
      caseData?.slug ||
      (caseData?.patient_name || caseData?.title
        ? slugify(`${caseData?.patient_name || caseData?.title}-${caseData?.chief_complaint || "case"}`)
        : null);

    if (caseKey) {
      list.push(
        ...withExts(`/images/cases/${caseKey}`),
        ...withExts(`/images/cases/${caseKey}/1`),
        ...withExts(`/images/cases/${caseKey}/2`),
        ...withExts(`/images/cases/${caseKey}/3`)
      );
    }

    // Only show images from public/images/cases; no other fallbacks

    // Deduplicate while keeping order
    return Array.from(new Set(list.filter(Boolean)));
  }, [sessionId, caseData]);

  if (!sources.length) return null;

  return (
    <div className="bg-surface rounded-xl border border-border/50 p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-foreground">Medical Images</h3>
        <p className="text-sm text-muted-foreground">Reference visuals to aid diagnosis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sources.map((src, idx) => (
          <a
            key={src + idx}
            href={src}
            target="_blank"
            rel="noreferrer noopener"
            className="group block"
          >
            <img
              src={src}
              alt={`Medical image ${idx + 1}`}
              className="aspect-video w-full object-cover rounded-lg border border-border/40 bg-elevated/40 transition-transform duration-200 group-hover:scale-[1.02]"
              onError={(e) => {
                // Hide tiles whose images don't exist yet
                e.currentTarget.parentElement.style.display = "none";
              }}
            />
          </a>
        ))}
      </div>
    </div>
  );
}

import { getPublications } from "@/data/intake-content";
import { PublicationsBrowser, type PublicationData } from "./PublicationsBrowser";

// Reads published /intake submissions from SQLite at request time, so this
// page must not be prerendered — a static build would freeze the list at
// build time and never show anything members post.
export const dynamic = "force-dynamic";

// Server component: reads the merged static + submitted publications, then hands
// them to the client component that does the search/collapse UI.
export default function PublicationsPage() {
  return <PublicationsBrowser publications={getPublications() as PublicationData} />;
}

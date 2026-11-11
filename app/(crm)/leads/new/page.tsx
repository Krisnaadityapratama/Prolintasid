import { getViewer } from "@/lib/auth";
import { getLeadOptions } from "@/lib/leads";
import LeadForm from "../LeadForm";

type NewLeadPageProps = { searchParams: Promise<{ error?: string }> };

export default async function NewLeadPage({ searchParams }: NewLeadPageProps) {
  const [{ error }, options] = await Promise.all([searchParams, getLeadOptions(), getViewer()]);
  return <LeadForm error={error} options={options} />;
}

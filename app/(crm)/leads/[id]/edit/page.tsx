import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getLead, getLeadOptions } from "@/lib/leads";
import LeadForm from "../../LeadForm";

type EditLeadPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditLeadPage({ params, searchParams }: EditLeadPageProps) {
  const [{ id }, { error }, viewer, options] = await Promise.all([params, searchParams, getViewer(), getLeadOptions()]);
  const lead = await getLead(id);
  if (!lead) notFound();
  if (lead.created_by !== viewer.id) redirect(`/leads/${id}`);
  return <LeadForm lead={lead} error={error} options={options} />;
}

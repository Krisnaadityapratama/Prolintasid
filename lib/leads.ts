import { cache } from "react";
import { unstable_cache } from "next/cache";
import { OPTION_GROUPS, type DashboardLead, type Lead, type LeadOption, type LeadOptions, type LeadSummary } from "@/lib/crm";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const getLeadOptions = unstable_cache(async function getLeadOptions(): Promise<LeadOptions> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lead_options")
    .select("id,category,label,sort_order")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat pilihan form. Pastikan migrasi lead_options sudah dijalankan: ${error.message}`);
  }

  const options = Object.fromEntries(
    OPTION_GROUPS.map(({ key }) => [key, [] as string[]]),
  ) as LeadOptions;

  for (const option of (data ?? []) as LeadOption[]) {
    if (option.category in options) options[option.category].push(option.label);
  }
  return options;
}, ["lead-options"], { revalidate: 300, tags: ["lead-options"] });

export const getLeadOptionRows = cache(async function getLeadOptionRows() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_options")
    .select("id,category,label,sort_order")
    .order("category")
    .order("sort_order")
    .order("label");
  if (error) throw new Error(`Gagal memuat pilihan form: ${error.message}`);
  return (data ?? []) as LeadOption[];
});

export const getLeads = cache(async function getLeads() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id,company,pic,phone,email,commodity,origin,destination,estimated_value,stage,follow_up,notes,creator:profiles!leads_created_by_fkey(id,full_name,email)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat leads: ${error.message}`);

  return (data ?? []).map((lead) => ({
    ...lead,
    creator: Array.isArray(lead.creator) ? lead.creator[0] ?? null : lead.creator,
  })) as LeadSummary[];
});

export const getDashboardLeads = cache(async function getDashboardLeads() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id,company,pic,industry,origin,destination,estimated_value,stage,follow_up,creator:profiles!leads_created_by_fkey(id,full_name,email)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat leads dashboard: ${error.message}`);

  return (data ?? []).map((lead) => ({
    ...lead,
    creator: Array.isArray(lead.creator) ? lead.creator[0] ?? null : lead.creator,
  })) as DashboardLead[];
});

export const getLead = cache(async function getLead(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*,creator:profiles!leads_created_by_fkey(id,full_name,email)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat detail lead: ${error.message}`);
  return (data ?? null) as Lead | null;
});

import { NextResponse, type NextRequest } from "next/server";
import { STAGES, type Lead } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 500;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim().toLowerCase() ?? "";
  const area = params.get("area") ?? "all";
  const stage = params.get("stage") ?? "all";
  const isValidStage = stage === "all" || stage === "aktif" || STAGES.some((item) => item.value === stage);
  if (!isValidStage) {
    return NextResponse.json({ error: "Filter tahap tidak valid." }, { status: 400 });
  }

  const leads: Lead[] = [];
  let offset = 0;
  while (true) {
    let leadQuery = supabase
      .from("leads")
      .select("*,creator:profiles!leads_created_by_fkey(id,full_name,email)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (area !== "all") leadQuery = leadQuery.eq("company_area", area);
    if (stage === "aktif") leadQuery = leadQuery.in("stage", ["baru", "hubungi", "kualifikasi", "penawaran", "nego"]);
    else if (stage !== "all") leadQuery = leadQuery.eq("stage", stage);

    const { data, error } = await leadQuery;
    if (error) {
      return NextResponse.json({ error: `Gagal memuat leads untuk ekspor: ${error.message}` }, { status: 500 });
    }

    const page = (data ?? []).map((lead) => ({
      ...lead,
      creator: Array.isArray(lead.creator) ? lead.creator[0] ?? null : lead.creator,
    })) as Lead[];
    if (!page.length) break;
    leads.push(...page);
    offset += page.length;
  }

  const filtered = query
    ? leads.filter((lead) => {
        const searchable = [lead.company, lead.pic, lead.commodity, lead.origin, lead.destination, lead.notes, lead.creator?.full_name]
          .filter(Boolean).join(" ").toLowerCase();
        return searchable.includes(query);
      })
    : leads;

  return NextResponse.json(filtered);
}

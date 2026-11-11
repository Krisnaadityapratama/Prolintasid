import { cache } from "react";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/crm";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const getViewer = cache(async function getViewer(): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat profil: ${error.message}`);
  const ownerEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() === ownerEmail) {
    if (data?.role === "owner" && data.is_active) return data as Profile;
    const admin = createAdminClient();
    const { data: owner, error: ownerError } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name ?? "Admin Utama",
          role: "owner",
          is_active: true,
        },
        { onConflict: "id" },
      )
      .select("id,email,full_name,role,is_active")
      .single();
    if (ownerError) throw new Error(`Gagal menyiapkan Admin Utama: ${ownerError.message}`);
    return owner as Profile;
  }

  if (data?.is_active) return data as Profile;
  if (data) {
    await supabase.auth.signOut();
    redirect("/login");
  }
  redirect("/login?error=Akun+belum+terdaftar.+Hubungi+Admin+Utama.");
});

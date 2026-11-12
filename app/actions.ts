"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { OPTION_GROUPS, STAGES } from "@/lib/crm";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(_previousState: { error: string | null }, formData: FormData) {
  const email = text(formData, "email").toLowerCase();
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";
  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = error.code === "email_not_confirmed"
      ? "Email akun belum dikonfirmasi. Hubungi Admin Utama."
      : error.code === "invalid_credentials"
        ? "Email atau kata sandi salah. Periksa kembali lalu coba lagi."
        : "Login gagal. Silakan coba beberapa saat lagi.";
    return { error: message };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", session.user.id)
    .maybeSingle();
  if (profileError) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw new Error(`Gagal menghentikan sesi setelah pemeriksaan akun gagal: ${signOutError.message}`);
    return { error: "Status akun tidak dapat diperiksa. Silakan coba lagi atau hubungi Admin Utama." };
  }
  if (!profile?.is_active) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw new Error(`Gagal menghentikan sesi akun beku: ${signOutError.message}`);
    return { error: "Akun Anda sedang dibekukan. Hubungi Admin Utama." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Gagal keluar: ${error.message}`);
  redirect("/login");
}

export async function saveLead(formData: FormData) {
  const viewer = await getViewer();
  const id = text(formData, "id");
  const company = text(formData, "company");
  if (!company) redirect(id ? `/leads/${id}?error=Nama+perusahaan+wajib+diisi.` : "/leads/new?error=Nama+perusahaan+wajib+diisi.");
  const stage = STAGES.find((item) => item.value === (text(formData, "stage") || "baru"));
  if (!stage) redirect(id ? `/leads/${id}?error=Tahap+lead+tidak+valid.` : "/leads/new?error=Tahap+lead+tidak+valid.");

  const payload = {
    company,
    pic: text(formData, "pic") || null,
    job_title: text(formData, "job_title") || null,
    phone: text(formData, "phone") || null,
    email: text(formData, "email") || null,
    industry: text(formData, "industry") || null,
    commodity: text(formData, "commodity") || null,
    modes: formData.getAll("modes").filter((value): value is string => typeof value === "string"),
    services: formData.getAll("services").filter((value): value is string => typeof value === "string"),
    origin: text(formData, "origin") || null,
    destination: text(formData, "destination") || null,
    volume: text(formData, "volume") ? Number(text(formData, "volume")) : null,
    unit: text(formData, "unit") || null,
    incoterm: text(formData, "incoterm") || null,
    frequency: text(formData, "frequency") || null,
    estimated_value: Number(text(formData, "estimated_value").replace(/\D/g, "")) || 0,
    source: text(formData, "source") || null,
    stage: stage.value,
    temperature: text(formData, "temperature") || null,
    follow_up: ["won", "lost"].includes(text(formData, "stage"))
      ? null
      : text(formData, "follow_up") || null,
    notes: text(formData, "notes") || null,
    lost_reason: text(formData, "stage") === "lost" ? text(formData, "lost_reason") || null : null,
    closed_at: ["won", "lost"].includes(text(formData, "stage")) ? new Date().toISOString() : null,
  };
  if (payload.volume !== null && (!Number.isFinite(payload.volume) || payload.volume < 0)) {
    redirect(id ? `/leads/${id}?error=Volume+tidak+valid.` : "/leads/new?error=Volume+tidak+valid.");
  }
  const supabase = await createClient();
  let existingLead: Record<string, unknown> | null = null;
  if (id) {
    const { data: existing, error: existingError } = await supabase
      .from("leads")
      .select("stage,closed_at,modes,services,industry,source,unit,incoterm,frequency,temperature,lost_reason")
      .eq("id", id)
      .eq("created_by", viewer.id)
      .maybeSingle();
    if (existingError) redirect(`/leads/${id}?error=${encodeURIComponent("Gagal memuat lead. " + existingError.message)}`);
    if (!existing) redirect(`/leads/${id}?error=Lead+tidak+ditemukan+atau+bukan+milik+Anda.`);
    existingLead = existing;
  }

  const { data: savedOptions, error: optionsError } = await supabase
    .from("lead_options")
    .select("category,label");
  if (optionsError) {
    const destination = id ? `/leads/${id}` : "/leads/new";
    redirect(`${destination}?error=${encodeURIComponent("Gagal memeriksa pilihan form. Jalankan migrasi lead_options.")}`);
  }
  const availableOptions = new Set(
    (savedOptions ?? []).map((option) => `${option.category}\u0000${option.label}`),
  );
  const requestedOptions: { category: string; label: string }[] = [
    ...payload.modes.map((label) => ({ category: "modes", label })),
    ...payload.services.map((label) => ({ category: "services", label })),
  ];
  const optionalOptions: [string, string | null][] = [
    ["industries", payload.industry],
    ["sources", payload.source],
    ["units", payload.unit],
    ["incoterms", payload.incoterm],
    ["frequencies", payload.frequency],
    ["temperatures", payload.temperature],
    ["lost_reasons", payload.lost_reason],
  ];
  optionalOptions.forEach(([category, label]) => {
    if (label) requestedOptions.push({ category, label });
  });
  const fieldByCategory: Record<string, string> = {
    industries: "industry",
    sources: "source",
    units: "unit",
    incoterms: "incoterm",
    frequencies: "frequency",
    temperatures: "temperature",
    lost_reasons: "lost_reason",
  };
  const isAvailableOrUnchanged = ({ category, label }: { category: string; label: string }) => {
    if (availableOptions.has(`${category}\u0000${label}`)) return true;
    const previous = existingLead?.[fieldByCategory[category] ?? category];
    return Array.isArray(previous) ? previous.includes(label) : previous === label;
  };
  if (requestedOptions.some((option) => !isAvailableOrUnchanged(option))) {
    const destination = id ? `/leads/${id}` : "/leads/new";
    redirect(`${destination}?error=${encodeURIComponent("Ada pilihan yang sudah tidak tersedia. Muat ulang form dan pilih item yang tersedia.")}`);
  }

  let result;
  if (id) {
    payload.closed_at = ["won", "lost"].includes(payload.stage)
      ? (existingLead?.stage === payload.stage && typeof existingLead.closed_at === "string" ? existingLead.closed_at : new Date().toISOString())
      : null;
    result = await supabase.from("leads").update(payload).eq("id", id).eq("created_by", viewer.id).select("id").maybeSingle();
  } else {
    result = await supabase.from("leads").insert({ ...payload, created_by: viewer.id }).select("id").single();
  }

  if (result.error) {
    const destination = id ? `/leads/${id}` : "/leads/new";
    redirect(`${destination}?error=${encodeURIComponent("Lead gagal disimpan. " + result.error.message)}`);
  }
  if (!result.data) redirect(`/leads/${id}?error=Lead+tidak+ditemukan+atau+bukan+milik+Anda.`);

  revalidatePath("/");
  revalidatePath("/leads");
  redirect(`/leads/${result.data.id}`);
}

export async function addLeadOption(formData: FormData) {
  const viewer = await getViewer();
  if (viewer.role !== "owner" && viewer.role !== "admin") {
    redirect("/?error=Hanya+Admin+yang+dapat+mengelola+pilihan+form.");
  }

  const categoryValue = text(formData, "category");
  const group = OPTION_GROUPS.find((item) => item.key === categoryValue);
  const label = text(formData, "label");
  if (!group || !label || label.length > 80) {
    redirect("/admin/options?error=Kategori+atau+nama+pilihan+tidak+valid.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lead_options").insert({
    category: group.key,
    label,
    created_by: viewer.id,
  });
  if (error) {
    const message = error.code === "23505"
      ? "Pilihan tersebut sudah tersedia pada kategori ini."
      : `Gagal menambahkan pilihan. ${error.message}`;
    redirect(`/admin/options?error=${encodeURIComponent(message)}`);
  }

  revalidateTag("lead-options");
  revalidatePath("/admin/options");
  revalidatePath("/leads");
  revalidatePath("/leads/new");
  redirect("/admin/options?notice=Pilihan+berhasil+ditambahkan.");
}

export async function deleteLeadOption(formData: FormData) {
  const viewer = await getViewer();
  if (viewer.role !== "owner" && viewer.role !== "admin") {
    redirect("/?error=Hanya+Admin+yang+dapat+mengelola+pilihan+form.");
  }

  const id = text(formData, "id");
  if (!id) redirect("/admin/options?error=ID+pilihan+tidak+valid.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_options")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(`/admin/options?error=${encodeURIComponent("Pilihan gagal dihapus. Jalankan migrasi SQL hak akses delete. " + error.message)}`);
  }
  if (!data) redirect("/admin/options?error=Pilihan+tidak+ditemukan+atau+akses+ditolak.");

  revalidateTag("lead-options");
  revalidatePath("/admin/options");
  revalidatePath("/leads/new");
  revalidatePath("/leads");
  redirect("/admin/options?notice=Pilihan+berhasil+dihapus.");
}

export async function deleteLead(formData: FormData) {
  const viewer = await getViewer();
  const id = text(formData, "id");
  if (!id) redirect("/leads?error=ID+lead+tidak+valid.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("created_by", viewer.id)
    .select("id")
    .maybeSingle();
  if (error) redirect(`/leads/${id}?error=${encodeURIComponent("Lead gagal dihapus. " + error.message)}`);
  if (!data) redirect(`/leads/${id}?error=Lead+tidak+ditemukan+atau+bukan+milik+Anda.`);
  revalidatePath("/");
  revalidatePath("/leads");
  redirect("/leads?notice=Lead+berhasil+dihapus.");
}

export async function createTeamUser(formData: FormData) {
  const viewer = await getViewer();
  if (viewer.role !== "owner") redirect("/?error=Akses+ditolak.");

  const email = text(formData, "email").toLowerCase();
  const fullName = text(formData, "full_name");
  const role = text(formData, "role");
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";
  if (!email || !fullName || !["admin", "sales"].includes(role) || password.length < 8) {
    redirect("/admin/users?error=Periksa+data+pengguna.+Kata+sandi+minimal+8+karakter.");
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError) {
    const message = createError.code === "email_exists"
      ? "Email ini sudah terdaftar. Periksa daftar pengguna atau gunakan alamat lain."
      : `Akun gagal dibuat. ${createError.message}`;
    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }
  if (!created.user) {
    redirect("/admin/users?error=Supabase+tidak+mengembalikan+akun+yang+dibuat.");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    { id: created.user.id, email, full_name: fullName, role },
    { onConflict: "id" },
  );
  if (profileError) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(created.user.id);
    const message = cleanupError
      ? `Akun Auth berhasil dibuat, tetapi profil gagal disimpan dan akun belum terhapus. Hubungi administrator database. ${profileError.message}`
      : `Akun gagal disimpan dan sudah dibatalkan. ${profileError.message}`;
    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?notice=Akun+berhasil+dibuat.+Bagikan+email+dan+kata+sandi+secara+aman.");
}

export async function updateTeamUser(formData: FormData) {
  const viewer = await getViewer();
  if (viewer.role !== "owner") redirect("/?error=Akses+ditolak.");

  const id = text(formData, "id");
  const fullName = text(formData, "full_name");
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";
  if (!id || !fullName || (password && password.length < 8)) {
    redirect(`/admin/users/${encodeURIComponent(id)}/edit?error=Nama+wajib+diisi+dan+kata+sandi+minimal+8+karakter.`);
  }

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", id)
    .maybeSingle();
  if (targetError) {
    redirect(`/admin/users/${encodeURIComponent(id)}/edit?error=${encodeURIComponent("Gagal memuat akun. " + targetError.message)}`);
  }
  if (!target || target.role === "owner") redirect("/admin/users?error=Akun+tidak+ditemukan+atau+tidak+dapat+diubah.");

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", id);
  if (profileError) {
    redirect(`/admin/users/${encodeURIComponent(id)}/edit?error=${encodeURIComponent("Nama gagal disimpan. " + profileError.message)}`);
  }

  const authUpdate: { user_metadata: { full_name: string }; password?: string } = {
    user_metadata: { full_name: fullName },
  };
  if (password) authUpdate.password = password;

  const { error: authError } = await admin.auth.admin.updateUserById(id, authUpdate);
  if (authError) {
    const { error: rollbackError } = await admin
      .from("profiles")
      .update({ full_name: target.full_name })
      .eq("id", id);
    const message = rollbackError
      ? `Perubahan Auth gagal dan nama profil belum berhasil dipulihkan. Hubungi administrator. ${authError.message}`
      : `Perubahan akun gagal dan nama profil sudah dikembalikan. ${authError.message}`;
    redirect(`/admin/users/${encodeURIComponent(id)}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}/edit`);
  redirect("/admin/users?notice=Data+akun+berhasil+diperbarui.");
}

export async function deleteTeamUser(formData: FormData) {
  const viewer = await getViewer();
  if (viewer.role !== "owner") redirect("/?error=Akses+ditolak.");

  const id = text(formData, "id");
  if (!id || id === viewer.id) redirect("/admin/users?error=Tidak+dapat+menghapus+akun+yang+sedang+digunakan.");

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id,role")
    .eq("id", id)
    .maybeSingle();
  if (targetError) redirect(`/admin/users?error=${encodeURIComponent("Gagal memuat akun. " + targetError.message)}`);
  if (!target || target.role === "owner") redirect("/admin/users?error=Akun+Admin+Utama+tidak+dapat+dihapus.");

  const { count, error: leadsError } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("created_by", id);
  if (leadsError) redirect(`/admin/users?error=${encodeURIComponent("Gagal memeriksa leads milik akun. " + leadsError.message)}`);
  if (count) {
    redirect(`/admin/users?error=${encodeURIComponent(`Akun masih memiliki ${count} lead. Pindahkan lead tersebut sebelum menghapus akun.`)}`);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) {
    redirect(`/admin/users?error=${encodeURIComponent("Akun gagal dihapus. " + deleteError.message)}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?notice=Akun+berhasil+dihapus.");
}

export async function setTeamUserActive(formData: FormData) {
  const viewer = await getViewer();
  if (viewer.role !== "owner") redirect("/?error=Akses+ditolak.");

  const id = text(formData, "id");
  const activeValue = text(formData, "is_active");
  if (!id || id === viewer.id || !["true", "false"].includes(activeValue)) {
    redirect("/admin/users?error=Status+akun+tidak+valid.");
  }
  const isActive = activeValue === "true";
  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id,role,is_active")
    .eq("id", id)
    .maybeSingle();
  if (targetError) redirect(`/admin/users?error=${encodeURIComponent("Gagal memuat akun. " + targetError.message)}`);
  if (!target || target.role === "owner") redirect("/admin/users?error=Akun+Admin+Utama+tidak+dapat+diubah.");
  if (target.is_active === isActive) redirect("/admin/users?notice=Status+akun+tidak+berubah.");

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: isActive ? "none" : "876000h",
  });
  if (authError) {
    redirect(`/admin/users?error=${encodeURIComponent("Status login akun gagal diperbarui. " + authError.message)}`);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);
  if (profileError) {
    const { error: rollbackError } = await admin.auth.admin.updateUserById(id, {
      ban_duration: target.is_active ? "none" : "876000h",
    });
    const message = rollbackError
      ? `Status profil gagal disimpan dan status login Auth belum berhasil dipulihkan. Hubungi administrator. ${profileError.message}`
      : `Status akun gagal disimpan. Perubahan login Auth sudah dibatalkan. ${profileError.message}`;
    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/users");
  redirect(`/admin/users?notice=Akun+berhasil+${isActive ? "diaktifkan" : "dibekukan"}.`);
}

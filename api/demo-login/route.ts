import { NextResponse } from "next/server";

const demoAccounts = {
  "administrator@etw.demo": "administrator" as const,
  "broker@etw.demo": "broker" as const,
};

function demoIsEnabled() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export async function POST(request: Request) {
  if (!demoIsEnabled()) return NextResponse.json({ error: "Tryb demonstracyjny jest wyłączony." }, { status: 404 });
  const { email, password } = await request.json();
  const role = demoAccounts[String(email).toLowerCase() as keyof typeof demoAccounts];
  if (!role || password !== "demo123") return NextResponse.json({ error: "Nieprawidłowe dane demonstracyjne." }, { status: 401 });
  const response = NextResponse.json({ role });
  response.cookies.set("etw_demo_role", role, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("etw_demo_role", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { createRemoteProject, deleteRemoteProject, getRemoteProject, putRemoteProject } from "@/lib/remoteCarouselProjects";
import { getLegacyHermesProject } from "@/lib/legacyHermesProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    let result = await getRemoteProject(projectId);

    if (result.status === 404) {
      const legacy = getLegacyHermesProject(projectId);
      if (legacy) {
        const created = await createRemoteProject(legacy);
        if (created.ok || created.status === 409) {
          result = await getRemoteProject(projectId);
        }
      }
    }

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.status === 404 ? "project_not_found" : "remote_error" },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const body = await req.json();
    const result = await putRemoteProject(projectId, body);
    return NextResponse.json(result.data ?? { ok: result.ok }, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const result = await deleteRemoteProject(projectId);
    return NextResponse.json(result.data ?? { ok: result.ok }, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

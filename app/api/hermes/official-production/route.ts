import { NextRequest, NextResponse } from "next/server";
import { OFFICIAL_PAUTAS } from "@/lib/officialPautas";
import { OFFICIAL_PROJECTS } from "@/lib/officialPautaProjects";
import { OFFICIAL_IMAGE_JOBS } from "@/lib/officialImageBriefs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ok:false,error:"unauthorized"},{status:401});
  return NextResponse.json({
    ok:true,
    policy:{
      reference:"CM-037",
      audience:"mulheres reais 45+",
      palette:"preto, bege, dourado",
      recycled_test_images:false,
      image_rule:"cada card usa imagem específica do próprio projeto",
      completion_rule:"somente pronto após Studio + Render + revisão visual",
    },
    totals:{projects:OFFICIAL_PROJECTS.length,image_jobs:OFFICIAL_IMAGE_JOBS.length},
    pautas:OFFICIAL_PAUTAS,
    projects:OFFICIAL_PROJECTS,
    image_jobs:OFFICIAL_IMAGE_JOBS,
  });
}

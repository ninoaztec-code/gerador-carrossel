import { NextResponse } from "next/server";
import { INSTAGRAM_45PLUS_LIBRARY, MASTER_INSTRUCTION, TEMPLATE_USAGE_GUIDE } from "@/lib/instagramTemplateLibrary";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: 2,
    canvas: { width: 1080, height: 1350, ratio: "4:5" },
    master_instruction: MASTER_INSTRUCTION,
    templates: TEMPLATE_USAGE_GUIDE,
    template_count: INSTAGRAM_45PLUS_LIBRARY.length,
    rules: {
      choose_template_before_copy: true,
      preserve_photo_slots: true,
      preserve_card_roles: true,
      studio_controls_crop_zoom_position: true,
      preferred_image_field: "image_data_url",
      complete_only_when_images_visible: true,
    },
  });
}

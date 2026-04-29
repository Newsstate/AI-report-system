import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // -----------------------------------
    // 1. Get request body
    // -----------------------------------
    const body = await request.json();

    const requestId = body.requestId;

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 2. Trigger n8n webhook
    // -----------------------------------
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL missing in env" },
        { status: 500 }
      );
    }

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error("Failed to trigger n8n workflow");
    }

    const result = await n8nResponse.json();

    // -----------------------------------
    // 3. Update Supabase record
    // -----------------------------------
    await (supabase as any)
      .from("report_requests")
      .update({
        status: "processing",
        n8n_execution_id: result?.executionId || null,
        n8n_triggered_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // -----------------------------------
    // 4. Success response
    // -----------------------------------
    return NextResponse.json({
      success: true,
      executionId: result?.executionId || null,
    });

  } catch (error) {
    console.error("Automation trigger error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

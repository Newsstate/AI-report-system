// src/app/api/automation/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // -----------------------------
    // 1. Get reportId from request
    // -----------------------------
    const body = await req.json();
    const reportId = body.reportId;

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 2. Fetch report from Supabase
    // -----------------------------
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (error) {
      console.error("Supabase error:", error);

      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Fix TypeScript "never" issue
    const report = data as any;

    // -----------------------------
    // 3. Get n8n execution id
    // -----------------------------
    let execId: string | null = null;

    if (report && report.n8n_execution_id) {
      execId = report.n8n_execution_id;
    }

    // -----------------------------
    // 4. Return status
    // -----------------------------
    return NextResponse.json({
      success: true,
      executionId: execId,
      report,
    });
  } catch (err) {
    console.error("Automation status error:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";

import OpenAI from "openai";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const userApiKey = formData.get("apiKey");
    const model = formData.get("model") || "gpt-5-mini";

    if (!userApiKey) {
      return new Response("Missing API key", { status: 400 });
    }

    const files = formData.getAll("file");
    if (!files || files.length === 0) {
      return new Response("No files uploaded", { status: 400 });
    }

    function guessMime(name) {
      const ext = (name || "").split(".").pop()?.toLowerCase();
      switch (ext) {
        case "jpg":
        case "jpeg":
          return "image/jpeg";
        case "png":
          return "image/png";
        case "gif":
          return "image/gif";
        case "webp":
          return "image/webp";
        case "bmp":
          return "image/bmp";
        case "heic":
          return "image/heic";
        default:
          return "image/png";
      }
    }

    const client = new OpenAI({ apiKey: userApiKey });

    const content = [
      {
        type: "input_text",
        text: `You are given ${files.length} document(s) containing handwritten or printed student notes (may include PDF, PPTX, or image files).
    
    Your task: Transcribe the content into clean, structured Markdown text suitable for Notion.
    
    Rules:
    1. Transcribe **exact text** as it appears — including headers, lists, bullet points, and spacing.
    2. If **tables** are present, reconstruct them accurately using standard Markdown table syntax.
    3. If **math formulas** or equations are present, keep their **original notation** or render them in LaTeX-style (inline: $...$, block: $$...$$).
    4. If **drawings, diagrams, or non-text elements** are present, describe them briefly in parentheses like: (Drawing: ...).
    5. Do not summarize or explain anything. Preserve structure and flow exactly.
    6. Separate each file’s transcription with a line: 
    --- Page X ---
    7. Do not wrap the entire output in a Markdown code block.`,
      },
    ];

    for (const file of files) {
      if (!file || typeof file === "string") continue;
      const bytes = await file.arrayBuffer();
      const mimeFromFile =
        file.type && file.type.startsWith("image/") && file.type !== "application/octet-stream"
          ? file.type
          : null;
      const mime = mimeFromFile || guessMime(file.name);
      const base64 = Buffer.from(bytes).toString("base64");
      const dataUrl = `data:${mime};base64,${base64}`;
      content.push({ type: "input_image", image_url: dataUrl });
    }

    const response = await client.responses.create({
      model,
      input: [{ role: "user", content }],
    });

    let text = "";
    if (response.output_text) {
      text = response.output_text.trim();
    } else if (Array.isArray(response.output)) {
      text = response.output
        .flatMap((o) => o.content || [])
        .map((c) => (typeof c?.text === "string" ? c.text : ""))
        .join("\n");
    }

    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      `Server error: ${(err && err.message) || "unknown error"}`,
      { status: 500 }
    );
  }
}

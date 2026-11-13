import { generateText } from "ai";
import { NextResponse } from "next/server";
import { model } from "@/lib/ai";

export async function POST(request: Request) {
	const { prompt } = await request.json();

	const result = await generateText({
		model: model,
		system: "You are a concise programming tutor.",
		prompt,
		temperature: 0.2,
		maxOutputTokens: 200,
	});

	return NextResponse.json({
		text: result.text,
		usage: result.usage,
		model: result.response.modelId,
	});
}

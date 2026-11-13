import { streamText } from "ai";
import { model } from "@/lib/ai";

export async function POST(request: Request) {
	const { prompt } = await request.json();

	const result = streamText({
		model: model,
		system: "You are a concise programming tutor.",
		prompt,
		temperature: 0.2,
		maxOutputTokens: 200,
		onError({ error }) {
			console.error("LLM streaming error:", error);
		},
	});

	return result.toTextStreamResponse();
}

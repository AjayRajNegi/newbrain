import { streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { model } from "@/lib/ai";
import { buildRagPrompt } from "@/lib/rag-prompt";
import { retrieveChunks } from "@/lib/retrieval";

const ChatRequestSchema = z.object({
	tenantId: z.string().min(1),
	question: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
	const body = ChatRequestSchema.safeParse(await request.json());

	if (!body.success) {
		return NextResponse.json(
			{ error: "Invalid chat request" },
			{ status: 400 },
		);
	}

	const { tenantId, question } = body.data;

	const chunks = await retrieveChunks({
		tenantId,
		query: question,
		topK: 5,
	});

	const { system, prompt } = buildRagPrompt(question, chunks);

	const citations = chunks.map((chunk, index) => ({
		sourceId: `S${index + 1}`,
		documentId: chunk.documentId,
		documentTitle: chunk.documentTitle,
		chunkIndex: chunk.chunkIndex,
		content: chunk.content,
	}));

	const result = streamText({
		model,
		system,
		prompt,
		temperature: 0.2,
		maxOutputTokens: 800,
	});

	return result.toTextStreamResponse({
		headers: {
			"X-Brand-Brain-Citations": encodeURIComponent(JSON.stringify(citations)),
		},
	});
}

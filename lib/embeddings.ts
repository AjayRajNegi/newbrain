import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

const embeddingModel = google.embedding("gemini-embedding-001");

export async function embedDocuments(texts: string[]) {
	const result = await embedMany({
		model: embeddingModel,
		values: texts,
		maxParallelCalls: 2,
		providerOptions: {
			google: {
				outputDimensionality: 768,
				taskType: "RETRIEVAL_DOCUMENT",
			},
		},
	});

	return { embeddings: result.embeddings, tokens: result.usage.tokens };
}

export async function embedQuery(text: string) {
	const result = await embed({
		model: embeddingModel,
		value: text,
		providerOptions: {
			google: {
				outputDimensionality: 768,
				taskType: "RETRIEVAL_QUERY",
			},
		},
	});

	return {
		embedding: result.embedding,
		tokens: result.usage.tokens,
	};
}

import type { RetrievedChunk } from "@/lib/retrieval";

export function buildRagPrompt(question: string, chunks: RetrievedChunk[]) {
	const context = chunks
		.map(
			(chunk, index) => `
[S${index + 1}]
Source: ${chunk.documentTitle}
Chunk: ${chunk.chunkIndex}
Content:
${chunk.content}
`,
		)
		.join("\n");

	return {
		system: `
You are Brand Brain, a knowledge assistant.

Rules:
- Answer using only the supplied context.
- Never invent product facts or policies.
- If the context does not contain the answer, say you don't know.
- Cite sources using [S1], [S2], etc.
- Cite claims near the statements they support.
- Do not cite sources that do not support your answer.
- Be concise and helpful.
`,
		prompt: `
Context:
${context || "No relevant documents were found."}

Question:
${question}
`,
	};
}

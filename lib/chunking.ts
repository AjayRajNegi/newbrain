export interface TextChunk {
	content: string;
	chunkIndex: number;
}

export function chunkText(
	text: string,
	chunkSize = 1000,
	overlap = 200,
): TextChunk[] {
	if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
		throw new Error("Invalid chunk configuration");
	}

	const normalized = text.replace(/\s+/g, " ").trim();

	if (!normalized) {
		return [];
	}

	const chunks: TextChunk[] = [];
	let start = 0;

	while (start < normalized.length) {
		const end = Math.min(start + chunkSize, normalized.length);

		chunks.push({
			content: normalized.slice(start, end),
			chunkIndex: chunks.length,
		});

		if (end === normalized.length) break;

		start = end - overlap;
	}

	return chunks;
}

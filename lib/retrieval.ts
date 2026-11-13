import { prisma } from "@/lib/db";
import { embedQuery } from "@/lib/embeddings";

export interface RetrievedChunk {
	id: string;
	content: string;
	chunkIndex: number;
	documentId: string;
	documentTitle: string;
	similarity: number;
}

interface RawChunk {
	id: string;
	content: string;
	chunkIndex: number;
	documentId: string;
	documentTitle: string;
	distance: number;
}

export async function retrieveChunks({
	tenantId,
	query,
	topK = 5,
}: {
	tenantId: string;
	query: string;
	topK?: number;
}): Promise<RetrievedChunk[]> {
	const { embedding } = await embedQuery(query);

	const vector = JSON.stringify(embedding);

	const rows = await prisma.$queryRaw<RawChunk[]>`
    SELECT
      c.id,
      c.content,
      c."chunkIndex",
      c."documentId",
      d.title AS "documentTitle",
      c.embedding <=> ${vector}::vector AS distance
    FROM chunks c
    JOIN documents d ON d.id = c."documentId"
    WHERE
      c."tenantId" = ${tenantId}
      AND d."tenantId" = ${tenantId}
      AND d.status = 'READY'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vector}::vector
    LIMIT ${Math.max(1, Math.min(topK, 20))}
  `;

	return rows.map((row) => ({
		id: row.id,
		content: row.content,
		chunkIndex: row.chunkIndex,
		documentId: row.documentId,
		documentTitle: row.documentTitle,
		similarity: 1 - row.distance,
	}));
}

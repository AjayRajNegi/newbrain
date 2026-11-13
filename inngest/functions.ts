import { chunkText } from "@/lib/chunking";
import { prisma } from "@/lib/db";
import { embedDocuments } from "@/lib/embeddings";
import { inngest } from "./client";

export const ingestDocument = inngest.createFunction(
	{
		id: "ingest-document",
		retries: 3,
		triggers: { event: "document/ingest.requested" },
	},
	async ({ event, step }) => {
		const { documentId } = event.data;

		const document = await step.run("load-document", async () => {
			const doc = await prisma.document.findUnique({
				where: { id: documentId },
			});

			if (!doc) throw new Error(`Document ${documentId} not found`);

			return doc;
		});

		await step.run("mark-processing", async () => {
			await prisma.document.update({
				where: { id: documentId },
				data: { status: "PROCESSING", errorMessage: null },
			});
		});

		const chunks = await step.run("chunk-document", async () => {
			return chunkText(document.sourceText);
		});

		const embeddings = await step.run("embed-chunks", async () => {
			return embedDocuments(chunks.map((chunk) => chunk.content));
		});

		await step.run("store-chunks", async () => {
			await prisma.$transaction(async (tx) => {
				await tx.chunk.deleteMany({
					where: { documentId },
				});

				for (let i = 0; i < chunks.length; i++) {
					const chunk = chunks[i];
					const embedding = embeddings.embeddings[i];

					await tx.$executeRaw`
            INSERT INTO "chunks" (
              "id",
              "tenantId",
              "documentId",
              "content",
              "contentHash",
              "chunkIndex",
              "embedding",
              "createdAt"
            )
            VALUES (
              ${crypto.randomUUID()},
              ${document.tenantId},
              ${documentId},
              ${chunk.content},
              ${document.contentHash},
              ${chunk.chunkIndex},
              ${JSON.stringify(embedding)}::vector,
              NOW()
            )
          `;
				}
			});
		});

		await step.run("mark-ready", async () => {
			await prisma.document.update({
				where: { id: documentId },
				data: {
					status: "READY",
					chunkCount: chunks.length,
				},
			});
		});

		return {
			documentId,
			chunkCount: chunks.length,
			embeddingTokens: embeddings.tokens,
		};
	},
);

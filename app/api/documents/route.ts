import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
	const form = await request.formData();

	const file = form.get("file");
	const tenantId = form.get("tenantId");

	if (!(file instanceof File) || typeof tenantId !== "string") {
		return NextResponse.json(
			{ error: "file and tenantId are required" },
			{ status: 400 },
		);
	}

	const allowed = [".txt", ".md"];
	const extension = file.name.slice(file.name.lastIndexOf("."));

	if (!allowed.includes(extension.toLowerCase())) {
		return NextResponse.json(
			{ error: "Only .txt and .md files are supported currently" },
			{ status: 415 },
		);
	}

	if (file.size > 1_000_000) {
		return NextResponse.json(
			{ error: "File must be smaller than 1 MB" },
			{ status: 413 },
		);
	}

	const sourceText = await file.text();

	if (!sourceText.trim()) {
		return NextResponse.json({ error: "Document is empty" }, { status: 400 });
	}

	const contentHash = createHash("sha256").update(sourceText).digest("hex");

	const tenant = await prisma.tenant.findUnique({
		where: { id: tenantId },
	});

	if (!tenant) {
		return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
	}

	const document = await prisma.document.upsert({
		where: {
			tenantId_contentHash: {
				tenantId,
				contentHash,
			},
		},
		create: {
			tenantId,
			title: String(form.get("title") || file.name),
			originalName: file.name,
			mimeType: file.type || "text/plain",
			contentHash,
			sourceText,
			status: "PENDING",
		},
		update: {
			status: "PENDING",
			errorMessage: null,
		},
	});

	await inngest.send({
		name: "document/ingest.requested",
		data: { documentId: document.id },
	});

	return NextResponse.json(
		{
			documentId: document.id,
			status: document.status,
		},
		{ status: 202 },
	);
}

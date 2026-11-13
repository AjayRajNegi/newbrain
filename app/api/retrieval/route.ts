import { NextResponse } from "next/server";
import { retrieveChunks } from "@/lib/retrieval";

export async function POST(request: Request) {
	const { tenantId, query } = await request.json();

	if (
		typeof tenantId !== "string" ||
		typeof query !== "string" ||
		!query.trim()
	) {
		return NextResponse.json(
			{ error: "tenantId and query are required" },
			{ status: 400 },
		);
	}

	const chunks = await retrieveChunks({
		tenantId,
		query,
		topK: 5,
	});

	return NextResponse.json({ chunks });
}

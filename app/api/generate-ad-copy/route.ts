import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import z from "zod";
import { model } from "@/lib/ai";

const AdCopySchema = z.object({
	headlines: z.array(z.string()).length(3),
	tone: z.string(),
	cta: z.string(),
});

export async function POST(request: Request) {
	const { product } = await request.json();

	const result = await generateText({
		model,
		output: Output.object({
			schema: AdCopySchema,
		}),
		prompt: `Generate ad copy for this product: ${product}`,
	});

	return NextResponse.json(result.output);
}

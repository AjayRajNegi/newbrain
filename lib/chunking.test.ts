import { describe, expect, it } from "vitest";
import { chunkText } from "./chunking";

describe("chunkText", () => {
	it("returns no chunks for empty text", () => {
		expect(chunkText("")).toEqual([]);
	});

	it("returns one chunk for short text", () => {
		expect(chunkText("Hello world")).toEqual([
			{
				content: "Hello world",
				chunkIndex: 0,
			},
		]);
	});

	it("creates overlapping chunks", () => {
		const chunks = chunkText("a".repeat(2500), 1000, 200);

		expect(chunks).toHaveLength(3);
		expect(chunks[0].content).toHaveLength(1000);
		expect(chunks[1].content).toHaveLength(1000);
		expect(chunks[2].content).toHaveLength(900);

		expect(chunks[0].content.slice(-200)).toBe(chunks[1].content.slice(0, 200));
	});
});

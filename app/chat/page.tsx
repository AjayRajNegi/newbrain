"use client";

import { useState } from "react";

interface Citation {
	sourceId: string;
	documentId: string;
	documentTitle: string;
	chunkIndex: number;
	content: string;
}

export default function ChatPage() {
	const [question, setQuestion] = useState("");
	const [answer, setAnswer] = useState("");
	const [citations, setCitations] = useState<Citation[]>([]);
	const [loading, setLoading] = useState(false);

	async function sendMessage() {
		if (!question.trim() || loading) return;

		setAnswer("");
		setCitations([]);
		setLoading(true);

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					tenantId: "YOUR_TENANT_ID",
					question,
				}),
			});

			if (!response.ok || !response.body) {
				throw new Error("Chat request failed");
			}

			const citationHeader = response.headers.get("X-Brand-Brain-Citations");

			if (citationHeader) {
				setCitations(JSON.parse(decodeURIComponent(citationHeader)));
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { value, done } = await reader.read();

				if (done) break;

				setAnswer((previous) => previous + decoder.decode(value));
			}
		} catch (error) {
			setAnswer(
				error instanceof Error ? error.message : "Something went wrong",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="mx-auto max-w-2xl p-6">
			<h1 className="text-2xl font-semibold">Brand Brain</h1>

			<textarea
				value={question}
				onChange={(event) => setQuestion(event.target.value)}
				placeholder="Ask about your documents..."
				className="mt-6 w-full rounded border p-3"
				rows={3}
			/>

			<button
				onClick={sendMessage}
				disabled={loading || !question.trim()}
				className="mt-3 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
			>
				{loading ? "Generating..." : "Ask"}
			</button>

			{answer && (
				<section className="mt-8">
					<h2 className="font-semibold">Answer</h2>
					<pre className="mt-2 whitespace-pre-wrap font-sans">{answer}</pre>
				</section>
			)}

			{citations.length > 0 && (
				<section className="mt-8">
					<h2 className="font-semibold">Sources</h2>

					<ul className="mt-3 space-y-3">
						{citations.map((citation) => (
							<li key={citation.sourceId} className="rounded border p-3">
								<div className="font-medium">
									[{citation.sourceId}] {citation.documentTitle}
								</div>

								<div className="text-sm text-gray-500">
									Chunk {citation.chunkIndex}
								</div>

								<p className="mt-2 text-sm">{citation.content}</p>
							</li>
						))}
					</ul>
				</section>
			)}
		</main>
	);
}

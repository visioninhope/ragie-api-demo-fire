"use client";
import { useState } from "react";
import { retrieveChunks } from "@/actions/retrieveChunks"; // Import the retrieval function
import { generateWithChunks } from "@/actions/generateActions"; // Import the new generation function
import { readStreamableValue } from "ai/rsc"; // Import to handle streaming response

// Define a type for the chunk structure
type Chunk = {
  text: string;
  score: number;
};

// Define a type for the server response
type RetrievalResponse = {
  scored_chunks: Chunk[];
};

export default function GenerateContent() {
  const [query, setQuery] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [status, setStatus] = useState<string>(""); // State to indicate current status

  // Handle both retrieval and generation in a single function
  const handleAsk = async (): Promise<void> => {
    try {
      setIsGenerating(true);
      setStatus("Retrieving..."); // Set status to retrieving
      setGeneratedContent(""); // Clear previous content

      // Step 1: Retrieve chunks from Ragie
      const data: RetrievalResponse = await retrieveChunks(query);
      console.log("Retrieved chunks from Ragie:", data);

      // Step 2: Generate content using the retrieved chunks
      setStatus("Generating..."); // Update status to generating

      const result = await generateWithChunks(
        data.scored_chunks.map((chunk) => chunk.text), // Pass only the chunk texts
        query,
        "gpt-4o" // Adjust the model name as needed
      );

      // Stream the response to handle progressive updates
      for await (const content of readStreamableValue(result)) {
        if (content) {
          setGeneratedContent(content.trim());
        }
      }
    } catch (error) {
      console.error("Error during retrieval or generation:", error);
    } finally {
      setIsGenerating(false);
      setStatus(""); // Reset status after completion
    }
  };

  // Separate input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Ask a Question of the Documents
      </h1>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Type your question here..."
          className="w-full px-3 py-2 border rounded-md"
        />
        <button
          onClick={handleAsk}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={isGenerating} // Disable button while generating
        >
          {status || "Ask Question"} {/* Display status or default text */}
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-800">Generated Content</h2>
      <div className="mt-4 p-4 border rounded-lg shadow-sm bg-gray-50">
        <p className="text-gray-700 whitespace-pre-wrap">{generatedContent}</p>
      </div>
    </div>
  );
}

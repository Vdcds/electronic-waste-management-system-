import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    console.log("Received prompt:", prompt);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Define the system prompt for e-waste management expertise
    const systemPrompt =
      "You are an expert e-waste manager with extensive knowledge of electronic waste management, recycling processes, environmental regulations, and sustainable practices. Your expertise includes handling hazardous materials, implementing circular economy principles, and advising on proper disposal methods for electronic devices. Please provide detailed, professional guidance while maintaining environmental responsibility and compliance with international e-waste standards.";

    // Combine system prompt with user prompt
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;

    // Create a streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start generating content with the combined prompt
    const result = await model.generateContentStream(fullPrompt);

    // Stream the response
    (async () => {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }
      } catch (error) {
        console.error("Streaming error:", error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

const encoder = new TextEncoder();

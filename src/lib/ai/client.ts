import OpenAI from "openai";
import { tools } from "./tools";
import { BLESSAS_SYSTEM_PROMPT } from "./system-prompt";

const NVIDIA_BASE_URL =
  process.env.AI_BASE_URL || "https://integrate.api.nvidia.com/v1";

export function createAIClient() {
  const apiKey = process.env.AI_API_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn("AI_API_KEY not set, AI features will be limited");
  }
  return new OpenAI({
    apiKey: apiKey || "missing",
    baseURL: NVIDIA_BASE_URL,
  });
}

export async function chatWithBlessas(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { canvasState?: string }
) {
  const client = createAIClient();
  const model =
    process.env.AI_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b";

  const systemContent = options?.canvasState
    ? `${BLESSAS_SYSTEM_PROMPT}\n\n【目前白板狀態】\n${options.canvasState}`
    : BLESSAS_SYSTEM_PROMPT;

  const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  const response = await client.chat.completions.create({
    model,
    messages: fullMessages,
    tools: tools as any,
    tool_choice: "auto",
    temperature: 0.3,
    max_tokens: 2048,
  });

  return response;
}

export async function askBlessas(
  userMessage: string,
  history: OpenAI.Chat.ChatCompletionMessageParam[] = [],
  canvasState?: string
) {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...history,
    { role: "user", content: userMessage },
  ];
  const completion = await chatWithBlessas(messages, { canvasState });
  return completion.choices[0]?.message;
}

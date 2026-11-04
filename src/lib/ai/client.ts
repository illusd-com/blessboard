import OpenAI from "openai";
import { tools } from "./tools";
import { BLESSAS_SYSTEM_PROMPT } from "./system-prompt";

const NVIDIA_BASE_URL =
  process.env.AI_BASE_URL || "https://integrate.api.nvidia.com/v1";

export function createAIClient() {
  const apiKey = process.env.AI_API_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn("AI_API_KEY not set");
  }
  return new OpenAI({
    apiKey: apiKey || "missing",
    baseURL: NVIDIA_BASE_URL,
  });
}

/** 判斷使用者是否在要求「動白板」 */
function wantsBoardAction(text: string): boolean {
  return /寫|新增|加入|生成|建立|記|待辦|列表|整理|排版|刪除|移動|更新|筆記|標題|大綱|結果/.test(
    text
  );
}

/** 從模型純文字裡盡力抽出假 tool call（部分模型不回正式 tool_calls） */
export function extractFallbackToolCalls(content: string | null | undefined) {
  if (!content) return [] as any[];
  const calls: any[] = [];

  // ```json { "name": "add_text", "arguments": {...} } ```
  const fence = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(content))) {
    try {
      const obj = JSON.parse(m[1]);
      if (obj.name && (obj.arguments || obj.parameters)) {
        calls.push({
          id: `fallback_${calls.length}`,
          type: "function",
          function: {
            name: obj.name,
            arguments: JSON.stringify(obj.arguments || obj.parameters || {}),
          },
        });
      }
      if (Array.isArray(obj.tool_calls)) {
        for (const tc of obj.tool_calls) {
          calls.push(tc);
        }
      }
    } catch {
      /* ignore */
    }
  }

  // add_text(...) 簡單解析
  const addTextRe =
    /add_text\s*\(\s*x\s*=\s*(-?\d+)\s*,\s*y\s*=\s*(-?\d+)\s*,\s*text\s*=\s*["']([\s\S]*?)["']\s*\)/gi;
  while ((m = addTextRe.exec(content))) {
    calls.push({
      id: `fallback_add_${calls.length}`,
      type: "function",
      function: {
        name: "add_text",
        arguments: JSON.stringify({
          x: Number(m[1]),
          y: Number(m[2]),
          text: m[3],
        }),
      },
    });
  }

  return calls;
}

export async function chatWithBlessas(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { canvasState?: string; forceTools?: boolean }
) {
  const client = createAIClient();
  const model =
    process.env.AI_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b";

  const systemContent = `${BLESSAS_SYSTEM_PROMPT}\n\n【目前白板狀態】\n${options?.canvasState || "（空）"}`;

  const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  // 若使用者要動白板，強制 tool_choice
  const toolChoice = options?.forceTools
    ? ("required" as const)
    : ("auto" as const);

  try {
    const response = await client.chat.completions.create({
      model,
      messages: fullMessages,
      tools: tools as any,
      tool_choice: toolChoice,
      temperature: 0.2,
      max_tokens: 2048,
    });
    return response;
  } catch (err: any) {
    // 某些模型不支援 tool_choice=required，退回 auto 再試一次
    if (options?.forceTools) {
      const response = await client.chat.completions.create({
        model,
        messages: fullMessages,
        tools: tools as any,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 2048,
      });
      return response;
    }
    throw err;
  }
}

export async function askBlessas(
  userMessage: string,
  history: OpenAI.Chat.ChatCompletionMessageParam[] = [],
  canvasState?: string
) {
  const forceTools = wantsBoardAction(userMessage);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...history,
    {
      role: "user",
      content: forceTools
        ? `${userMessage}\n\n（系統提醒：請用 tool call 實際寫入白板，不要只回文字。）`
        : userMessage,
    },
  ];

  const completion = await chatWithBlessas(messages, {
    canvasState,
    forceTools,
  });

  const msg = completion.choices[0]?.message;
  if (!msg) return msg;

  // 正規化 tool_calls
  let toolCalls = (msg as any).tool_calls || [];
  if (!toolCalls.length) {
    const fallback = extractFallbackToolCalls(msg.content);
    if (fallback.length) {
      (msg as any).tool_calls = fallback;
      toolCalls = fallback;
    }
  }

  // 仍無工具但使用者要寫入：由後端合成一個 add_text，把模型文字當內容寫上白板
  if (!toolCalls.length && forceTools && msg.content) {
    const text = String(msg.content).slice(0, 2000);
    (msg as any).tool_calls = [
      {
        id: "synthetic_add_text",
        type: "function",
        function: {
          name: "add_text",
          arguments: JSON.stringify({
            x: 100,
            y: 100,
            text,
            width: 360,
          }),
        },
      },
    ];
    msg.content = "已將結果寫入白板。";
  }

  return msg;
}

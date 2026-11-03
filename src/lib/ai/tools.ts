import { z } from "zod";

export const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_canvas_state",
      description: "取得目前白板所有物件的摘要（id、類型、位置、內容）。在執行任何修改前，強烈建議先呼叫此工具。",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_text",
      description: "在指定座標新增一個文字物件",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X 座標" },
          y: { type: "number", description: "Y 座標" },
          text: { type: "string", description: "文字內容" },
          fontSize: { type: "number", description: "字體大小，預設 20" },
          color: { type: "string", description: "顏色 hex" },
          width: { type: "number" },
        },
        required: ["x", "y", "text"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_image",
      description: "在指定座標新增一張圖片",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          url: { type: "string" },
          width: { type: "number" },
          height: { type: "number" },
        },
        required: ["x", "y", "url"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_text",
      description: "修改既有文字物件的內容或樣式",
      parameters: {
        type: "object",
        properties: {
          shapeId: { type: "string" },
          text: { type: "string" },
          fontSize: { type: "number" },
          color: { type: "string" },
        },
        required: ["shapeId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "move_shapes",
      description: "移動一個或多個物件",
      parameters: {
        type: "object",
        properties: {
          shapeIds: { type: "array", items: { type: "string" } },
          dx: { type: "number" },
          dy: { type: "number" },
        },
        required: ["shapeIds", "dx", "dy"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_shapes",
      description: "刪除指定物件",
      parameters: {
        type: "object",
        properties: {
          shapeIds: { type: "array", items: { type: "string" } },
        },
        required: ["shapeIds"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "arrange_shapes",
      description: "將物件自動排版成網格、直欄或橫列",
      parameters: {
        type: "object",
        properties: {
          shapeIds: { type: "array", items: { type: "string" } },
          layout: { type: "string", enum: ["grid", "column", "row"] },
          gap: { type: "number" },
        },
        required: ["layout"],
      },
    },
  },
];

export type ToolName =
  | "get_canvas_state"
  | "add_text"
  | "add_image"
  | "update_text"
  | "move_shapes"
  | "delete_shapes"
  | "arrange_shapes";

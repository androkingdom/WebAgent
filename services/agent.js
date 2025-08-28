import { google } from "@ai-sdk/google";
import { Agent, run, tool } from "@openai/agents";
import { aisdk } from "@openai/agents-extensions";
import { z } from "zod";
import { ToolsService } from "@/services/tools.js";

// --- System Prompt ---
export const SYSTEM_PROMPT = `
You are "Web-Agent", a focused browser automation assistant.
You control a Playwright-powered Chromium via TOOLS. Complete tasks ONLY by reasoning step-by-step and then calling the provided tools. Never invent tools.

IMPORTANT BEHAVIOR
- For normal greetings/acknowledgements ("hi", "thanks", "yo"): reply briefly in plain text WITHOUT tools.
- Be concise. Report only what you did or will do next. No filler.

AVAILABLE TOOLS
1) navigate(url)
   - Open (or reuse) the browser and navigate to the URL.

2) analyze_page()
   - Capture the current DOM + screenshot metadata. Use when you need to understand what’s on screen before acting.

3) scroll(direction, amount?)
   - direction ∈ {up, down, left, right}; amount defaults to 500px if not specified.

4) smart_click({ selector | text | coords:{x,y} })
   - Prefer selector; then text; use coords only when necessary (e.g., canvas/icon without DOM handle).

5) key_press({ text | shortcut })
   - text: types characters into the focused field.
   - shortcut: presses a key combo (e.g., "Enter", "Tab", "Control+L").

CALLING TOOLS
- If a parameter is not used, pass null for that field (the API requires explicit nulls, not omitted keys).
- Break tasks into small, verifiable steps.
- Prefer DOM-first strategies (selector/text) before resorting to coords.
- Use analyze_page() whenever unsure what elements exist.

EXAMPLES

Example 1:
Task: "Go to https://www.google.com, type hello world, and press search."
Steps:
- navigate("https://www.google.com")
- smart_click({ selector: "input[name='q']", text: null, coords: null })
- key_press({ text: "hello world", shortcut: null })
- key_press({ text: null, shortcut: "Enter" })

Example 2:
Task: "Open Instagram and sign up."
Steps:
- navigate("https://instagram.com")
- analyze_page()
- smart_click({ selector: "button[type='submit']", text: null, coords: null })
- key_press({ text: "my-email@example.com", shortcut: null })
- key_press({ text: null, shortcut: "Tab" })
- key_press({ text: "MyStrongPassword!", shortcut: null })
- smart_click({ selector: "button[type='submit']", text: null, coords: null })

Example 3:
Task: "Try to login to GitHub."
Steps:
- navigate("https://github.com/login")
- analyze_page()
- smart_click({ selector: "#login_field", text: null, coords: null })
- key_press({ text: "my-username", shortcut: null })
- smart_click({ selector: "#password", text: null, coords: null })
- key_press({ text: "my-password", shortcut: null })
- smart_click({ selector: "input[type='submit']", text: null, coords: null })

RULES
1) For automation requests, ALWAYS use the provided tools.
2) Do not fabricate results; report only what tool outputs and visible state imply.
3) Keep responses to the point: either a tool call or a short confirmation of the action/result.
4) If a step fails or target is ambiguous, retry with analyze_page() → selector/text → coords as fallback.
5) No data exfiltration, no local machine access, no unrelated tasks.

End of prompt.
`;

// --- Tools ---
let browserPage; // keep current page reference

export const navigate = tool({
  name: "navigate",
  description: "Launch browser and go to a URL",
  parameters: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const { page } = await ToolsService.launchBrowser(url);
    browserPage = page;
    return `Navigated to ${url}`;
  },
});

const analyze_page = tool({
  name: "analyze_page",
  description: "Take a screenshot and describe current page state",
  parameters: z.object({}),
  async execute() {
    if (!browserPage) return "No page open yet!";
    const buffer = await browserPage.screenshot();
    // ⚠️ optionally send `buffer` to Gemini Vision here
    return `Screenshot taken (${buffer.length} bytes).`;
  },
});

export const smart_click = tool({
  name: "smart_click",
  description: "Click an element by selector, text, or coordinates",
  parameters: z.object({
    selector: z.string().nullable(),
    text: z.string().nullable(),
    coords: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .nullable(),
  }),
  async execute({ selector, text, coords }) {
    if (!browserPage) throw new Error("No page open. Use navigate first.");
    await ToolsService.smartClick(browserPage, { selector, text, coords });
    return "Click action executed";
  },
});

export const scroll = tool({
  name: "scroll",
  description: "Scroll the page",
  parameters: z.object({
    direction: z.enum(["up", "down"]),
  }),
  async execute({ direction }) {
    if (!browserPage) throw new Error("No page open.");
    await ToolsService.scrollPage(browserPage, direction);
    return `Scrolled ${direction}`;
  },
});

export const key_press = tool({
  name: "key_press",
  description: "Type text or press a shortcut",
  parameters: z.object({
    shortcut: z.string().nullable(),
    text: z.string().nullable(),
  }),
  async execute({ shortcut, text }) {
    if (!browserPage) throw new Error("No page open.");
    await ToolsService.keyPress(browserPage, { shortcut, text });
    return `Key action executed`;
  },
});

// --- Agent Setup ---
const model = aisdk(google("gemini-2.5-flash-lite"));

const agent = new Agent({
  name: "web-agent",
  instructions: SYSTEM_PROMPT,
  model,
  tools: [navigate, analyze_page, scroll, smart_click, key_press],
});

const runAgent = async (input) => {
  const response = await run(agent, input);
  return response;
};

export default runAgent;

# 🕹️ Web-Agent

**Web-Agent** is a browser automation assistant powered by **Playwright** and **Google Gemini AI**.
It can automatically navigate, click, scroll, and type on websites based on tasks you provide. It also supports vision-based page analysis using screenshots.

**Note:** For normal greetings or acknowledgments, it responds naturally in plain text without automation.

---

## Features

- 🔹 Launch Chromium browser and navigate to URLs
- 🔹 Analyze pages via screenshots and AI reasoning
- 🔹 Smart click using CSS selectors, text, or coordinates
- 🔹 Keyboard input automation (typing & shortcuts)
- 🔹 Page scrolling in any direction
- 🔹 Step-by-step task automation with AI guidance
- 🔹 Handles normal greetings and polite confirmations

---

## System Requirements

- Node.js >= 20
- Playwright (`npm install playwright`)
- OpenAI Agents SDK (`@openai/agents`, `@openai/agents-extensions`)
- Google Gemini AI access (Gemini 2.5 Flash‑Lite recommended for high-throughput & vision tasks)

---

## Installation

```bash
git clone https://github.com/yourusername/web-agent.git
cd web-agent
npm install
```

> Ensure your `.env` includes your Gemini API key:

```env
GOOGLE_API_KEY=your_key_here
```

---

## Project Structure

```
/services
 ├─ tools.js       # Playwright browser helpers (click, scroll, type, analyze page)
 └─ agent.js       # Agent setup with tools and Gemini integration
/app
 └─ page.jsx       # Frontend interface to send tasks
```

---

## Available Tools

| Tool                     | Description                               |                                        |                                        |
| ------------------------ | ----------------------------------------- | -------------------------------------- | -------------------------------------- |
| `navigate(url)`          | Open or reuse browser and go to a URL     |                                        |                                        |
| `analyze_page()`         | Capture DOM + screenshot for AI reasoning |                                        |                                        |
| `scroll(direction)`      | Scroll page up/down/left/right            |                                        |                                        |
| \`smart_click({ selector | text                                      | coords })\`                            | Click element using DOM or coordinates |
| \`key_press({ text       | shortcut })\`                             | Type characters or press key shortcuts |                                        |

---

## Usage

### Frontend Form

Use the provided React form to send tasks:

```jsx
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("input")} placeholder="Type task..." />
  <button type="submit">Send</button>
</form>
```

### API Example

```js
import runAgent from "@/services/agent";

const response = await runAgent("Go to https://example.com and login");
console.log(response.finalOutput);
```

---

## Example Tasks

1. **Google Search**

   ```text
   Task: "Go to google.com, type 'hello world', press search."
   ```

   Steps:

   - navigate("[https://www.google.com](https://www.google.com)")
   - smart_click({ selector: "input\[name='q']" })
   - key_press({ text: "hello world" })
   - key_press({ shortcut: "Enter" })

2. **Instagram Signup**

   - navigate("[https://instagram.com](https://instagram.com)")
   - analyze_page()
   - smart_click({ selector: "button\[type='submit']" })
   - key_press({ text: "[email@example.com](mailto:email@example.com)" })
   - key_press({ text: "MyStrongPassword!" })

3. **GitHub Login**

   - navigate("[https://github.com/login](https://github.com/login)")
   - smart_click({ selector: "#login_field" })
   - key_press({ text: "my-username" })
   - smart_click({ selector: "#password" })
   - key_press({ text: "my-password" })
   - smart_click({ selector: "input\[type='submit']" })

---

## Notes & Tips

- Always **use DOM selectors first**, fallback to text or coordinates only if necessary.
- `analyze_page()` is essential for AI reasoning on unknown pages.
- To prevent Gemini 500 errors: skip calling the AI when task is already complete.
- Cursor issues are solved by `mouse.move()` before `mouse.click()`.

---

## Troubleshooting

- **Browser cursor doesn’t click** → ensure `mouse.move()` is used before click.
- **500 errors from Gemini** → retry with a backoff or skip AI calls if `status: done`.
- **Timeouts** → increase Playwright `waitForTimeout` or use explicit waits for elements.

---

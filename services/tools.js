import { chromium } from "playwright";

export class ToolsService {
  static async launchBrowser(url) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);
    return { browser, page };
  }

  static async analizePage(page, task, aiClient) {
    const domText = await page.evaluate(() => document.body.innerText);

    if (task.successKeyword && domText.includes(task.successKeyword)) {
      return { status: "done" };
    }

    const screenshot = await page.screenshot({ type: "png" });

    const visionRes = await aiClient.generateContent([
      {
        role: "user",
        parts: [
          {
            text: `Task: ${task.desc}. 
            Tell me the NEXT action as JSON: {status, action, target}. 
            Use "selector" or "text" if possible, else coords.`,
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: screenshot.toString("base64"),
            },
          },
        ],
      },
    ]);

    let parsed;
    try {
      parsed = JSON.parse(visionRes.response.candidates[0].content[0].text);
    } catch (err) {
      parsed = {
        status: "error",
        raw: visionRes.response.candidates[0].content[0].text,
      };
    }
    return parsed;
  }

  static async scrollPage(page, direction = "down") {
    await page.evaluate((dir) => {
      window.scrollBy(
        0,
        dir === "down" ? window.innerHeight : -window.innerHeight
      );
    }, direction);
    await page.waitForTimeout(500);
  }

  static async smartClick(page, target) {
    if (target.selector) {
      await page.locator(target.selector).first().click();
    } else if (target.text) {
      await page.getByText(target.text, { exact: true }).first().click();
    } else if (target.coords) {
      await page.mouse.move(target.coords.x, target.coords.y);
      await page.mouse.click(target.coords.x, target.coords.y);
    }
    await page.waitForTimeout(500);
  }

  static async keyPress(page, input) {
    if (input.shortcut) {
      await page.keyboard.press(input.shortcut);
    } else if (input.text) {
      await page.keyboard.type(input.text);
    }
    await page.waitForTimeout(300);
  }
  static listTools() {
    return [
      "launchBrowser",
      "analizePage",
      "scrollPage",
      "smartClick",
      "keyPress",
    ];
  }
}

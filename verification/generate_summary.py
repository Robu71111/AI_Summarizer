from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 800})

        # Go to app
        page.goto("http://localhost:5000")

        # Input text
        test_text = "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. " * 5
        # The ID is user_text, not inputText
        page.fill("textarea#user_text", test_text)

        # Click Summarize
        # The ID is submitBtn
        page.click("button#submitBtn")

        # Wait for result
        # The result appears in .summary-output or buttons .export-buttons
        # Let's wait for the copy button to be visible
        try:
            page.wait_for_selector("button#copyBtn", timeout=60000) # 60s timeout for AI generation
        except:
            print("Timed out waiting for summary")

        # Take full screenshot
        page.screenshot(path="/home/jules/verification/summary_result_full.png")

        browser.close()

if __name__ == "__main__":
    run()

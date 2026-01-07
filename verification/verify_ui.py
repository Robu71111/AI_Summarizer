from playwright.sync_api import sync_playwright

def verify_ui_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to home
        page.goto("http://localhost:5000")

        # Check title
        print(f"Title: {page.title()}")

        # Take screenshot of the controls area
        # We want to see the buttons

        # Wait for elements to be visible
        page.wait_for_selector(".controls-card")

        # Screenshot full page
        page.screenshot(path="verification/ui_fix_verification.png", full_page=True)

        # Also screenshot just the controls card to inspect detail
        controls = page.locator(".controls-card")
        controls.screenshot(path="verification/controls_detail.png")

        # Screenshot History section (even if empty, to check layout)
        # It's hidden by default, let's inject a fake history item via JS to test it
        page.evaluate("""
            const item = {
                summary: "Test Summary",
                inputWords: 100,
                summaryWords: 50,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('summaryHistory', JSON.stringify([item]));
            location.reload();
        """)

        page.wait_for_timeout(1000) # Wait for reload
        page.screenshot(path="verification/history_verification.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    try:
        verify_ui_fixes()
        print("Verification script finished.")
    except Exception as e:
        print(f"Error: {e}")

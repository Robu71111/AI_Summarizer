from playwright.sync_api import sync_playwright

def verify_ui_hover():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to home
        page.goto("http://localhost:5000")

        # Scroll to features
        features_section = page.locator(".features-section")
        features_section.scroll_into_view_if_needed()

        # Locate the first feature item ("Lightning Fast")
        feature_item = page.locator(".feature-item").first

        # Hover over it
        feature_item.hover()

        # Wait a bit for transition
        page.wait_for_timeout(500)

        # Screenshot the features section
        page.screenshot(path="verification/features_hover.png", clip={
            "x": 0,
            "y": 600, # Approximate, or we can use the bounding box of features-section
            "width": 1200,
            "height": 600
        })

        # Better: Screenshot just the features section
        features_section.screenshot(path="verification/features_hover_focused.png")

        browser.close()

if __name__ == "__main__":
    verify_ui_hover()

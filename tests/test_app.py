import unittest
from app import app, build_prompt

class TestApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_home_page(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'AI Summarizer', response.data)

    def test_build_prompt(self):
        prompt = build_prompt("Test content", "2", "paragraph", "standard")
        self.assertIn("Test content", prompt)

if __name__ == '__main__':
    unittest.main()

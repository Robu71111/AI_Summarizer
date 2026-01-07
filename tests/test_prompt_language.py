import unittest
from app import build_prompt

class TestPromptGeneration(unittest.TestCase):
    def test_language_instruction_english(self):
        prompt = build_prompt("Test text", "2", "paragraph", "standard", "english")
        self.assertIn("OUTPUT LANGUAGE: ENGLISH", prompt)
        self.assertIn("You must generate the summary in ENGLISH", prompt)
        self.assertIn("YOU MUST TRANSLATE IT", prompt)

    def test_language_instruction_hindi(self):
        prompt = build_prompt("Test text", "2", "paragraph", "standard", "hindi")
        self.assertIn("OUTPUT LANGUAGE: HINDI", prompt)
        self.assertIn("You must generate the summary in HINDI", prompt)
        self.assertIn("YOU MUST TRANSLATE IT", prompt)

    def test_language_instruction_french(self):
        prompt = build_prompt("Test text", "2", "paragraph", "standard", "french")
        self.assertIn("OUTPUT LANGUAGE: FRENCH", prompt)
        self.assertIn("You must generate the summary in FRENCH", prompt)

if __name__ == '__main__':
    unittest.main()

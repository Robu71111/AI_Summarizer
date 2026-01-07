import unittest
from unittest.mock import patch, MagicMock
from app import extract_text_from_url
import requests

class TestUrlExtraction(unittest.TestCase):
    @patch('app.requests.get')
    def test_extract_text_from_url_success(self, mock_get):
        # Mock a successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'<html><body><p>This is a test paragraph.</p><script>console.log("ignore");</script></body></html>'
        mock_get.return_value = mock_response

        text = extract_text_from_url('http://example.com')
        self.assertEqual(text, 'This is a test paragraph.')

    @patch('app.requests.get')
    def test_extract_text_from_url_failure(self, mock_get):
        # Mock a failed response
        mock_get.side_effect = requests.RequestException("Connection error")

        text = extract_text_from_url('http://example.com')
        self.assertIsNone(text)

if __name__ == '__main__':
    unittest.main()

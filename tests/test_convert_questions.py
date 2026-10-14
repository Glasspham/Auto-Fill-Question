import csv
import importlib.util
import io
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('converter', ROOT / 'convert_questions.py')
converter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(converter)


class ConvertTests(unittest.TestCase):
    def test_source_and_lossless_csv(self):
        text = (ROOT / 'tests/fixtures/sample-questions.md').read_text(encoding='utf-8')
        rows = converter.parse_questions(text, 'SAMPLE')
        self.assertEqual(len(rows), 3)
        self.assertEqual([r['dap_an_dung'] for r in rows], list('CBD'))
        self.assertIn(r'\begin{array}{|c|c|}', rows[1]['noi_dung'])
        self.assertIn(r'\(Q_{t+1}=T\oplus Q_t\)', rows[0]['noi_dung'])
        self.assertEqual(list(csv.DictReader(io.StringIO(converter.to_csv(rows), newline=''))), rows)

    def test_vietnamese_multiline_and_sections(self):
        text = '## Câu 1. Nội dung, "trích dẫn"\nDòng hai\n\nA) Một\nTiếp ý\nB) Hai\nĐáp án: B\nGiải thích: Vì vậy.\nDòng sau.\n---\n'
        row = converter.parse_questions(text, 'VN')[0]
        self.assertEqual(row['A'], 'Một\nTiếp ý')
        self.assertEqual(row['giai_thich'], 'Vì vậy.\nDòng sau.')

    def test_reject_missing_duplicate_or_invalid_markers(self):
        valid = 'Question 1. Test\nA) One\nB) Two\nAnswer: B'
        for broken in [valid.replace('Answer: B', ''), valid.replace('B) Two', 'A) Two'), valid.replace('Answer: B', 'Answer: E'), valid + '\n' + valid, valid + '\nUnexpected text']:
            with self.subTest(text=broken), self.assertRaises(ValueError):
                converter.parse_questions(broken, 'TEST')


class IdentityMetadataTests(unittest.TestCase):
    def test_name_id_and_ex_header(self):
        text = ('Ex 1. Default\nA) One\nB) Two\nAnswer: A\n\n'
                'Ex 2. Custom\nA) One\nB) Two\nAnswer: B\nName: [CUSTOM-2] Custom title\n\n'
                'Ex 3. Vietnamese\nA) One\nB) Two\nAnswer: A\nTên câu hỏi: Tên riêng\nSố ID: VN-3')
        rows = converter.parse_questions(text, 'FILE')
        self.assertEqual([(r['ma_cau'], r['ten_cau']) for r in rows],
                         [('FILE-001', 'FILE - Question 1'), ('CUSTOM-2', 'Custom title'), ('VN-3', 'Tên riêng')])


if __name__ == '__main__':
    unittest.main()

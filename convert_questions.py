"""Convert structured Markdown/TXT questions to UTH Importer CSV (standard library only)."""
import argparse
import csv
import io
from pathlib import Path
import re

COLUMNS = ['ma_cau', 'danh_muc', 'ten_cau', 'noi_dung', 'A', 'B', 'C', 'D', 'E',
           'dap_an_dung', 'diem', 'giai_thich', 'tron_dap_an', 'trang_thai', 'danh_so',
           'phan_hoi_A', 'phan_hoi_B', 'phan_hoi_C', 'phan_hoi_D', 'phan_hoi_E']
HEADER = re.compile(r'^(?:#{1,6}[ \t]+)?(?:Question|Câu|Ex(?:ercise)?)[ \t]+(\d+)[.:][ \t]*(.*)$', re.I | re.M)
CHOICE = re.compile(r'^([A-E])[).][ \t]*(.*)$', re.M)
ANSWER = re.compile(r'^(?:Answer|Đáp án)[ \t]*:[ \t]*([A-E])[ \t]*$', re.I | re.M)
EXPLANATION = re.compile(r'^(?:Explanation|Giải thích)[ \t]*:[ \t]*(.*)', re.I)
NAME = re.compile(r'^(?:Name|Tên câu hỏi)[ \t]*:[ \t]*(.+)$', re.I)
IDENTIFIER = re.compile(r'^(?:ID|Số ID)[ \t]*:[ \t]*(.+)$', re.I)
TAGGED_NAME = re.compile(r'^\[([A-Za-z0-9_-]+)\]\s*(.*)$')


def parse_questions(text, prefix, category=''):
    text = text.lstrip('\ufeff').replace('\r\n', '\n').replace('\r', '\n')
    headers = list(HEADER.finditer(text))
    if not headers:
        raise ValueError('Không tìm thấy Question 1. hoặc Câu 1. ở đầu dòng.')
    if text[:headers[0].start()].strip():
        raise ValueError('Có nội dung trước câu đầu tiên. File phải bắt đầu bằng Question/Câu.')
    if not re.fullmatch(r'[\w-]+', prefix):
        raise ValueError('Tiền tố mã chỉ dùng chữ, số, dấu gạch ngang hoặc gạch dưới.')
    rows, seen = [], set()
    for i, header in enumerate(headers):
        number = int(header[1])
        if number <= 0 or number in seen:
            raise ValueError(f'Số câu không hợp lệ hoặc trùng: {number}.')
        seen.add(number)
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        body = (header[2] + text[header.end():end]).strip()
        # Optional separator is reserved for the end of each question block.
        body = re.sub(r'\n[ \t]*---[ \t]*$', '', body).rstrip()
        answers = list(ANSWER.finditer(body))
        if len(answers) != 1:
            raise ValueError(f'Câu {number}: cần đúng một dòng Answer: A–E / Đáp án: A–E.')
        answer = answers[0]
        tail = body[answer.end():].strip()
        feedback = ''
        custom_name = custom_id = ''
        if tail:
            lines, cursor = tail.split('\n'), 0
            while cursor < len(lines):
                line = lines[cursor].strip()
                if not line:
                    cursor += 1
                    continue
                name_match, id_match = NAME.match(line), IDENTIFIER.match(line)
                if name_match:
                    if custom_name:
                        raise ValueError(f'Câu {number}: Name / Tên câu hỏi chỉ được xuất hiện một lần.')
                    custom_name = name_match[1].strip()
                    cursor += 1
                    continue
                if id_match:
                    if custom_id:
                        raise ValueError(f'Câu {number}: ID / Số ID chỉ được xuất hiện một lần.')
                    custom_id = id_match[1].strip()
                    cursor += 1
                    continue
                break
            tail = '\n'.join(lines[cursor:]).strip()
            if tail:
                explanation = EXPLANATION.match(tail)
                if not explanation:
                    raise ValueError(f'Câu {number}: sau Answer chỉ nhận Name, ID rồi Explanation / Giải thích.')
                feedback = (explanation[1] + tail[explanation.end():]).strip()
        tagged = TAGGED_NAME.match(custom_name)
        if tagged:
            if custom_id and custom_id != tagged[1]:
                raise ValueError(f'Câu {number}: Số ID “{custom_id}” không khớp ID “{tagged[1]}” trong Tên câu hỏi.')
            custom_id = custom_id or tagged[1]
            custom_name = tagged[2].strip() or custom_id
        question_and_choices = body[:answer.start()].rstrip()
        choices = list(CHOICE.finditer(question_and_choices))
        letters = [match[1] for match in choices]
        if not 2 <= len(choices) <= 5 or letters != list('ABCDE'[:len(choices)]):
            raise ValueError(f'Câu {number}: cần 2–5 lựa chọn liên tiếp A) đến E), không trùng.')
        content = question_and_choices[:choices[0].start()].strip()
        if not content:
            raise ValueError(f'Câu {number}: thiếu nội dung câu hỏi.')
        row = dict.fromkeys(COLUMNS, '')
        row.update(ma_cau=custom_id or f'{prefix}-{number:03d}', danh_muc=category,
                   ten_cau=custom_name or f'{prefix} - Question {number}', noi_dung=content,
                   dap_an_dung=answer[1].upper(), diem='1', giai_thich=feedback,
                   tron_dap_an='co', trang_thai='ready', danh_so='none')
        for j, choice in enumerate(choices):
            choice_end = choices[j + 1].start() if j + 1 < len(choices) else len(question_and_choices)
            value = (choice[2] + question_and_choices[choice.end():choice_end]).strip()
            if not value:
                raise ValueError(f'Câu {number}: lựa chọn {choice[1]} trống.')
            row[choice[1]] = value
        if row['dap_an_dung'] not in letters:
            raise ValueError(f'Câu {number}: đáp án đúng không có lựa chọn tương ứng.')
        rows.append(row)
    return rows


def to_csv(rows):
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=COLUMNS, quoting=csv.QUOTE_ALL, lineterminator='\r\n')
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, help='Mặc định: cùng tên nguồn, đuôi .csv')
    parser.add_argument('--prefix', help='Mặc định: tên file nguồn, ví dụ FF-T')
    parser.add_argument('--category', default='', help='Trống: dùng danh mục đang chọn trong website')
    args = parser.parse_args()
    output = args.output or args.source.with_suffix('.csv')
    if output.resolve() == args.source.resolve():
        parser.error('File đầu ra không được trùng file nguồn.')
    try:
        rows = parse_questions(args.source.read_text(encoding='utf-8-sig'), args.prefix or args.source.stem, args.category)
        payload = to_csv(rows)
        # Confirm lossless CSV serialization before writing the output.
        if list(csv.DictReader(io.StringIO(payload, newline=''))) != rows:
            raise ValueError('Kiểm tra round-trip CSV không thành công.')
        output.write_bytes(payload.encode('utf-8-sig'))
    except (ValueError, OSError) as exc:
        parser.error(str(exc))
    print(f'OK: {len(rows)} questions -> {output}')


if __name__ == '__main__':
    main()

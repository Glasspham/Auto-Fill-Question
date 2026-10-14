<p align="center">
  <img src="uth-question-importer/logo.png" alt="UTH Question Importer logo" width="96">
</p>

<h1 align="center">UTH Question Importer</h1>

<p align="center">
  Import single-answer multiple-choice questions from Excel, CSV, Markdown, or TXT into the UTH Moodle question bank.
</p>

<p align="center">
  <strong>English</strong> · <a href="README.vi.md">Tiếng Việt</a>
</p>

> Current source version: **1.5.8**. The tool is designed for `https://courses.ut.edu.vn` and depends on that site's current Moodle form structure.

## Features

- Reads `.xlsx`, `.csv`, `.md`, and `.txt` files locally in the browser.
- Validates question IDs, names, content, choices, grades, and correct answers before starting.
- Supports 2–5 consecutive choices and exactly one correct answer.
- Lets you preview every question before importing.
- Detects the active course and available question categories from the Moodle tab.
- Fills the first question and pauses for review before automation begins.
- Continues one question at a time or finishes the remaining batch automatically.
- Saves progress and logs locally so page navigation does not lose the current batch.
- Exports validated questions as Moodle XML.
- Supports light and dark themes.
- Preserves author-provided LaTeX delimiters without rewriting them.
- Always sets **Question status** to `Ready` and **Number the choices** to `No numbering`.
- Moves the correct answer to **Choice 1** while preserving the relative order of the incorrect choices.
- Provides both a Chrome Manifest V3 extension and a standalone Tampermonkey userscript.

## How it works

The importer uses your existing authenticated Moodle session. It opens the multiple-choice question form, fills the fields, submits the form, and verifies the saved question against the question bank before moving on.

The recommended workflow is deliberately review-first:

1. Load and validate the source file.
2. Connect the tool to an open UTH question-bank tab.
3. Click **Start** to fill the first question.
4. Review that question on Moodle.
5. Choose **Save & view next question** or **Auto-complete the remaining questions**.

The tool refuses to overwrite an existing question form and stops when a save result cannot be verified.

## Installation

### Option A: Chrome extension

This option provides a separate dashboard and stores batch progress in `chrome.storage.local`.

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `uth-question-importer` directory—the directory that directly contains `manifest.json`.
6. Sign in to `https://courses.ut.edu.vn` and open the course question bank.
7. Click the **UTH Question Importer** extension icon while that Moodle tab is active.

After updating the source, click **Reload** on the extension card and reopen the dashboard from the Moodle tab.

### Option B: Tampermonkey userscript

This option runs as an overlay directly on the UTH Moodle page.

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome.
2. Generate the userscript as described in [Development and packaging](#development-and-packaging), or use the versioned `.user.js` file from a release.
3. Open the `.user.js` file in Tampermonkey and confirm the installation.
4. Reload `https://courses.ut.edu.vn`.
5. Click the round UTH button in the lower-right corner.

The userscript is restricted to `https://courses.ut.edu.vn/*`.

## Quick start

1. Open the Moodle question bank and select the intended category.
2. Open UTH Question Importer.
3. Upload an Excel, CSV, Markdown, or TXT file. The maximum size is **5 MB**, with up to **1,000 questions** per batch.
4. Fix all validation errors and use **Preview questions** to inspect the parsed content.
5. Click **Reload website and categories**, then choose the destination category.
6. Click **Start**. The first question is filled but not immediately submitted.
7. Check the question text, LaTeX, choices, grade, category, ID number, and status on Moodle.
8. Continue manually or click **Auto-complete the remaining questions**.
9. Keep the target Moodle tab open and do not edit it manually while automatic processing is running.

## Markdown and TXT format

Save text files as UTF-8. Each question must begin at the start of a line with `Question n.`, `Câu n.`, or `Ex n.`.

```text
Question 1. What is the next state of a D flip-flop when \(D=1\)?
A) \(Q_{t+1}=0\)
B) \(Q_{t+1}=1\)
C) \(Q_{t+1}=Q_t\)
D) \(Q_{t+1}=\overline{Q_t}\)
Answer: B
Name: [FF-D-001] D flip-flop next state
ID: FF-D-001
Explanation: A D flip-flop follows \(Q_{t+1}=D\).
---
```

Rules:

- Choices must be consecutive from `A)` through `E)`; 2–5 choices are allowed.
- `Answer:` or `Đáp án:` is required and contains one letter from A to E.
- `Name:` / `Tên câu hỏi:` and `ID:` / `Số ID:` are optional and must appear after `Answer:` and before `Explanation:`.
- If `Name: [FF-D-001] ...` is present without a separate ID, the importer extracts `FF-D-001` automatically.
- Without custom metadata, the importer derives an ID from the file name and question number.
- `Explanation:` / `Giải thích:` and the `---` separator are optional.
- Inline LaTeX should use `\( ... \)`; display equations, arrays, and tables should use `\[ ... \]`.
- The importer preserves LaTeX exactly as authored. It does not add delimiters.
- Do not wrap the complete question file in a Markdown code fence.

See [DINH-DANG-TEXT.md](DINH-DANG-TEXT.md) for the parser specification and [PROMPT-AI-TAO-CAU-HOI.md](PROMPT-AI-TAO-CAU-HOI.md) for a prompt that instructs an AI to produce compatible questions.

## Excel and CSV format

Excel files must contain a `CauHoi` sheet. CSV files use the same column names and must be UTF-8. Do not use merged cells or formulas.

| Column | Description |
|---|---|
| `ma_cau` | Unique ID, up to 100 characters. Aliases: `ID`, `Số ID`. |
| `ten_cau` | Question name. Aliases: `Name`, `Tên câu hỏi`. |
| `danh_muc` | Optional category name or option value. The category selected in the UI takes priority. |
| `noi_dung` | Required question text. Multiline text and LaTeX are preserved. |
| `A` … `E` | Two to five consecutive choices. |
| `dap_an_dung` | One correct-answer letter from A to E. |
| `diem` | Positive default grade; defaults to `1`. |
| `giai_thich` | Optional general feedback. |
| `phan_hoi_A` … `phan_hoi_E` | Optional feedback for each choice. |
| `tron_dap_an` | `co` / `khong`; defaults to `co`. |
| `trang_thai` | Normalized to `ready`; an old `draft` value is ignored. |
| `danh_so` | Normalized to `none` for No numbering. |

An optional `CauHinh` sheet can define batch defaults with the columns `thuoc_tinh` and `gia_tri`. Use the bundled `uth-question-importer/UTH-cau-hoi-mau.xlsx` as a starting point.

## Converting Markdown or TXT to CSV

Python 3 is required only for this optional command-line converter:

Install the declared Python dependencies first. The current version uses only the Python standard library, so this command completes without downloading third-party packages:

```powershell
python -m pip install -r requirements.txt
```

```powershell
python convert_questions.py "path\to\questions.md"
```

To set an explicit prefix, category, or output path:

```powershell
python convert_questions.py "path\to\questions.txt" --prefix FF-T --category "T-FLIPFLOP" --output "path\to\questions.csv"
```

The converter writes UTF-8 CSV with a BOM and quotes all fields so multiline content and commas are preserved.

## Progress, verification, and recovery

- A save is considered successful only after Moodle returns a new `lastchanged` ID and the matching bank row contains the expected question name.
- If the result is uncertain because of a timeout, expired session, connection problem, or changed Moodle page, the batch pauses instead of resubmitting automatically.
- Search the bank for the current ID, then use the appropriate confirmation action in the progress panel.
- **Pause** does not cancel a form submission that has already been sent.
- Duplicate detection covers the input file and currently visible bank rows; it cannot guarantee uniqueness across every hidden or paginated bank item.
- Download the JSON log before starting a new batch if you need a permanent audit record.

## Moodle XML export

The preview dialog can export validated questions as Moodle XML. This export is independent of browser automation.

- Use a category name/path rather than Moodle's numeric option value.
- Moodle XML does not preserve the importer's `Ready` status choice.
- Review Moodle's import preview before completing an XML import.

## Privacy and permissions

- Source files are read locally in the browser.
- Progress and logs are stored locally by the extension or Tampermonkey.
- The extension requests access only to `https://courses.ut.edu.vn/*` plus Chrome storage, scripting, and alarms needed for its workflow.
- SheetJS is bundled locally; the importer does not upload question files to an AI service or telemetry endpoint.
- The tool operates through your current Moodle login and never stores your password.

## Development and packaging

Requirements:

- Chrome 120 or later
- Node.js 22 or later for development and tests
- PowerShell for ZIP packaging on Windows
- Python 3 only for the optional text-to-CSV converter

Install development dependencies:

```powershell
cd uth-question-importer
npm ci
```

Run the JavaScript tests:

```powershell
npm test
```

Run the dashboard browser smoke test:

```powershell
npm run test:browser
```

The optional `npm run test:fixtures` and `npm run test:userscript` commands use saved Moodle HTML fixtures. If those private fixtures are not present, those integration tests cannot run. The default `npm test` command is self-contained.

Build the standalone userscript:

```powershell
npm run build:userscript
```

The output is written to the repository root as `UTH-Question-Importer-v<version>.user.js`.

Build the Chrome extension ZIP:

```powershell
npm run package
```

The output is written to the repository root as `UTH-Question-Importer-v<version>.zip`, and the packaging script prints its SHA-256 hash.

## Repository layout

```text
Enter-Question/
├── README.md                         # English documentation
├── README.vi.md                      # Vietnamese documentation
├── DINH-DANG-TEXT.md                 # Markdown/TXT parser specification
├── PROMPT-AI-TAO-CAU-HOI.md          # AI authoring prompt
├── convert_questions.py              # Optional text-to-CSV converter
├── requirements.txt                  # Python dependency declaration
├── tests/fixtures/                    # Repository-owned input fixture
└── uth-question-importer/
    ├── manifest.json                 # Chrome extension manifest
    ├── core.js                       # Parsing, validation, and XML export
    ├── page.js                       # Moodle form adapter
    ├── background.js                 # Extension workflow controller
    ├── dashboard.html / dashboard.js # Extension interface
    ├── userscript/app.js             # Tampermonkey interface/controller
    ├── scripts/                      # Build and packaging scripts
    ├── tests/                        # Automated tests
    └── vendor/                       # Bundled SheetJS and its license
```

## Limitations

- Supports multiple-choice questions with exactly one correct answer.
- Does not import images, attachments, rich HTML, hints, tags, or other Moodle question types.
- Automatic filling depends on the current UTH Moodle DOM and may need updates after a site redesign.
- LaTeX rendering depends on Moodle's configured math filter.
- This is an independent utility and is not an official University of Transport Ho Chi Minh City or Moodle project.

## Troubleshooting

**Start is disabled**

- Select a valid input file, resolve all validation errors, and reconnect the Moodle tab and category.
- End or reconcile any unfinished batch shown in the progress panel.

**The form opens but remains empty**

- Wait for the page and TinyMCE editors to finish loading, then retry from a new empty multiple-choice form.
- Confirm that the active tab is still under `courses.ut.edu.vn` and belongs to the selected course.

**A blank fifth choice appears**

- Update to version 1.5.6 or later. Empty choices are written as truly empty values before saving.

**Question status is Draft**

- Update to version 1.5.8 or later and rebuild/reload the extension or userscript. Current imports always set `Ready`.

## Author

Created by [Glasspham](https://github.com/Glasspham).

## License

This repository currently does not include a project-level license. The bundled SheetJS license is available at `uth-question-importer/vendor/LICENSE`.

## References

- [Chrome Extensions: load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [Chrome `scripting` API](https://developer.chrome.com/docs/extensions/reference/api/scripting)
- [TinyMCE Editor API](https://www.tiny.cloud/docs/tinymce/latest/apis/tinymce.editor/)
- [Moodle XML format](https://docs.moodle.org/en/Moodle_XML_format)
- [Moodle question import](https://docs.moodle.org/en/Import_questions)


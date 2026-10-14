<p align="center">
  <img src="uth-question-importer/logo.png" alt="Logo UTH Question Importer" width="96">
</p>

<h1 align="center">UTH Question Importer</h1>

<p align="center">
  Nhập câu hỏi trắc nghiệm một đáp án đúng từ Excel, CSV, Markdown hoặc TXT vào ngân hàng câu hỏi Moodle UTH.
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>Tiếng Việt</strong>
</p>

> Phiên bản mã nguồn hiện tại: **1.5.8**. Tool được thiết kế cho `https://courses.ut.edu.vn` và phụ thuộc vào cấu trúc biểu mẫu Moodle hiện tại của website.

## Tính năng

- Đọc file `.xlsx`, `.csv`, `.md` và `.txt` ngay trên máy người dùng.
- Kiểm tra ID, tên, nội dung, lựa chọn, điểm và đáp án trước khi bắt đầu.
- Hỗ trợ 2–5 lựa chọn liên tiếp và đúng một đáp án đúng.
- Cho phép xem trước từng câu trước khi nhập.
- Đọc khóa học và danh mục câu hỏi từ tab Moodle đang mở.
- Điền câu đầu tiên rồi dừng để người dùng kiểm tra trước khi chạy tự động.
- Có thể lưu từng câu hoặc tự hoàn thành phần còn lại.
- Lưu tiến độ và nhật ký cục bộ khi Moodle chuyển trang.
- Xuất câu hỏi hợp lệ thành Moodle XML.
- Hỗ trợ giao diện sáng và tối.
- Giữ nguyên dấu phân cách LaTeX do người soạn cung cấp.
- Luôn đặt **Question status** thành `Ready` và **Number the choices** thành `No numbering`.
- Đưa đáp án đúng lên **Choice 1**, đồng thời giữ thứ tự tương đối của các đáp án sai.
- Cung cấp cả Chrome Extension Manifest V3 và userscript Tampermonkey một file.

## Cách hoạt động

Tool sử dụng phiên Moodle mà bạn đã đăng nhập. Nó mở biểu mẫu câu hỏi nhiều lựa chọn, điền dữ liệu, gửi biểu mẫu và đối chiếu câu đã lưu trong ngân hàng trước khi chuyển sang câu tiếp theo.

Luồng sử dụng khuyến nghị:

1. Nạp và kiểm tra file nguồn.
2. Kết nối tool với tab ngân hàng câu hỏi UTH đang mở.
3. Bấm **Bắt đầu** để điền câu đầu tiên.
4. Kiểm tra câu đó trên Moodle.
5. Chọn **Lưu & xem câu tiếp theo** hoặc **Auto hoàn thành phần còn lại**.

Tool từ chối ghi đè biểu mẫu câu hỏi đã có nội dung và sẽ dừng nếu không xác minh được kết quả lưu.

## Cài đặt

### Cách A: Chrome Extension

Cách này cung cấp một dashboard riêng và lưu tiến độ bằng `chrome.storage.local`.

1. Tải hoặc clone repository này.
2. Mở `chrome://extensions` trong Chrome.
3. Bật **Chế độ dành cho nhà phát triển / Developer mode**.
4. Chọn **Tải tiện ích đã giải nén / Load unpacked**.
5. Chọn thư mục `uth-question-importer`, tức thư mục chứa trực tiếp `manifest.json`.
6. Đăng nhập `https://courses.ut.edu.vn` và mở ngân hàng câu hỏi của khóa học.
7. Bấm biểu tượng **UTH Question Importer** khi tab Moodle đó đang được chọn.

Sau khi cập nhật mã nguồn, bấm **Reload** tại thẻ tiện ích rồi mở lại dashboard từ tab Moodle.

### Cách B: Userscript Tampermonkey

Cách này hiển thị tool trực tiếp bên trên trang Moodle.

1. Cài [Tampermonkey](https://www.tampermonkey.net/) trên Chrome.
2. Tạo userscript theo phần [Phát triển và đóng gói](#phát-triển-và-đóng-gói), hoặc dùng file `.user.js` có phiên bản trong Release.
3. Mở file `.user.js` bằng Tampermonkey và xác nhận cài đặt.
4. Tải lại `https://courses.ut.edu.vn`.
5. Bấm nút UTH hình tròn ở góc dưới bên phải.

Userscript chỉ chạy trên `https://courses.ut.edu.vn/*`.

## Bắt đầu nhanh

1. Mở ngân hàng câu hỏi Moodle và chọn danh mục cần nhập.
2. Mở UTH Question Importer.
3. Chọn file Excel, CSV, Markdown hoặc TXT. Mỗi file tối đa **5 MB** và mỗi đợt tối đa **1.000 câu**.
4. Sửa toàn bộ lỗi kiểm tra và dùng **Xem trước câu hỏi** để kiểm tra dữ liệu đã đọc.
5. Bấm **Đọc lại website và danh mục**, sau đó chọn danh mục đích.
6. Bấm **Bắt đầu**. Tool điền câu đầu tiên nhưng chưa lưu ngay.
7. Kiểm tra nội dung, LaTeX, lựa chọn, điểm, danh mục, Số ID và trạng thái trên Moodle.
8. Tiếp tục từng câu hoặc bấm **Auto hoàn thành phần còn lại**.
9. Giữ tab Moodle đích mở và không tự chỉnh sửa tab đó trong khi tool chạy tự động.

## Định dạng Markdown và TXT

Lưu file với mã hóa UTF-8. Mỗi câu phải bắt đầu ở đầu dòng bằng `Question n.`, `Câu n.` hoặc `Ex n.`.

```text
Question 1. Trạng thái kế tiếp của D flip-flop khi \(D=1\) là gì?
A) \(Q_{t+1}=0\)
B) \(Q_{t+1}=1\)
C) \(Q_{t+1}=Q_t\)
D) \(Q_{t+1}=\overline{Q_t}\)
Answer: B
Name: [FF-D-001] Trạng thái kế tiếp của D flip-flop
ID: FF-D-001
Explanation: D flip-flop tuân theo \(Q_{t+1}=D\).
---
```

Quy ước:

- Các lựa chọn phải liên tiếp từ `A)` đến `E)`; mỗi câu có 2–5 lựa chọn.
- `Answer:` hoặc `Đáp án:` là bắt buộc và chỉ chứa một chữ A–E.
- `Name:` / `Tên câu hỏi:` và `ID:` / `Số ID:` là tùy chọn, nằm sau `Answer:` và trước `Explanation:`.
- Nếu có `Name: [FF-D-001] ...` mà không có ID riêng, tool tự lấy `FF-D-001` làm ID.
- Khi không có metadata tùy chỉnh, tool tạo ID từ tên file và số thứ tự câu.
- `Explanation:` / `Giải thích:` và dấu phân cách `---` là tùy chọn.
- LaTeX trong dòng dùng `\( ... \)`; phương trình riêng, ma trận và bảng dùng `\[ ... \]`.
- Tool giữ nguyên LaTeX do người soạn cung cấp và không tự thêm dấu phân cách.
- Không bao toàn bộ file câu hỏi trong khối code Markdown.

Xem [DINH-DANG-TEXT.md](DINH-DANG-TEXT.md) để biết toàn bộ quy tắc bộ đọc và [PROMPT-AI-TAO-CAU-HOI.md](PROMPT-AI-TAO-CAU-HOI.md) để dùng prompt yêu cầu AI tạo câu hỏi đúng chuẩn.

## Định dạng Excel và CSV

File Excel phải có sheet `CauHoi`. CSV dùng cùng tên cột và mã hóa UTF-8. Không dùng ô gộp hoặc công thức.

| Cột | Mô tả |
|---|---|
| `ma_cau` | ID duy nhất, tối đa 100 ký tự. Bí danh: `ID`, `Số ID`. |
| `ten_cau` | Tên câu hỏi. Bí danh: `Name`, `Tên câu hỏi`. |
| `danh_muc` | Tên hoặc giá trị option của danh mục. Danh mục chọn trên giao diện được ưu tiên. |
| `noi_dung` | Nội dung bắt buộc; giữ nguyên xuống dòng và LaTeX. |
| `A` … `E` | Từ hai đến năm lựa chọn liên tiếp. |
| `dap_an_dung` | Một chữ A–E chỉ đáp án đúng. |
| `diem` | Điểm mặc định là số dương; mặc định `1`. |
| `giai_thich` | Phản hồi chung, có thể để trống. |
| `phan_hoi_A` … `phan_hoi_E` | Phản hồi riêng cho từng lựa chọn. |
| `tron_dap_an` | `co` / `khong`; mặc định `co`. |
| `trang_thai` | Luôn được chuẩn hóa thành `ready`; giá trị `draft` cũ bị bỏ qua. |
| `danh_so` | Luôn được chuẩn hóa thành `none` tương ứng No numbering. |

Sheet `CauHinh` là tùy chọn, dùng hai cột `thuoc_tinh` và `gia_tri` để đặt giá trị chung cho đợt nhập. Có thể bắt đầu từ file `uth-question-importer/UTH-cau-hoi-mau.xlsx` đi kèm.

## Chuyển Markdown hoặc TXT thành CSV

Chỉ công cụ chuyển đổi dòng lệnh này mới cần Python 3:

Cài các dependency Python đã khai báo trước. Phiên bản hiện tại chỉ dùng thư viện chuẩn của Python, vì vậy lệnh này hoàn tất mà không tải gói bên thứ ba:

```powershell
python -m pip install -r requirements.txt
```

```powershell
python convert_questions.py "duong-dan\de-cau-hoi.md"
```

Chỉ định tiền tố, danh mục hoặc đường dẫn đầu ra:

```powershell
python convert_questions.py "duong-dan\de-cau-hoi.txt" --prefix FF-T --category "T-FLIPFLOP" --output "duong-dan\de-cau-hoi.csv"
```

Script ghi CSV UTF-8 có BOM và đặt mọi trường trong dấu nháy kép để giữ dấu phẩy cùng nội dung nhiều dòng.

## Tiến độ, xác minh và khôi phục

- Tool chỉ xác nhận lưu thành công khi Moodle trả về ID `lastchanged` mới và hàng tương ứng có tên câu hỏi mong đợi.
- Nếu kết quả chưa rõ do quá thời gian, hết phiên đăng nhập, mất kết nối hoặc giao diện Moodle thay đổi, đợt nhập sẽ dừng thay vì tự gửi lại.
- Tìm ID hiện tại trong ngân hàng rồi chọn hành động xác nhận phù hợp tại phần tiến độ.
- **Tạm dừng** không hủy yêu cầu lưu đã được gửi lên website.
- Kiểm tra trùng bao phủ file đầu vào và các hàng đang hiển thị; không thể bảo đảm duy nhất trên toàn bộ các trang hoặc câu đang ẩn.
- Tải nhật ký JSON trước khi bắt đầu đợt mới nếu cần lưu hồ sơ lâu dài.

## Xuất Moodle XML

Hộp xem trước có thể xuất các câu hợp lệ thành Moodle XML. Chức năng này độc lập với luồng tự động điền biểu mẫu.

- Dùng tên/đường dẫn danh mục thay vì giá trị option dạng số của Moodle.
- Moodle XML không giữ lựa chọn trạng thái `Ready` của tool.
- Kiểm tra màn hình xem trước của Moodle trước khi hoàn tất nhập XML.

## Quyền riêng tư và quyền truy cập

- File nguồn được đọc cục bộ trong trình duyệt.
- Tiến độ và nhật ký được lưu cục bộ bởi extension hoặc Tampermonkey.
- Extension chỉ yêu cầu quyền trên `https://courses.ut.edu.vn/*`, cùng quyền storage, scripting và alarms cần cho luồng hoạt động.
- SheetJS được đóng gói cục bộ; tool không gửi file câu hỏi đến dịch vụ AI hoặc hệ thống theo dõi.
- Tool dùng phiên Moodle hiện tại và không lưu mật khẩu.

## Phát triển và đóng gói

Yêu cầu:

- Chrome 120 trở lên
- Node.js 22 trở lên để phát triển và chạy test
- PowerShell để đóng gói ZIP trên Windows
- Python 3 chỉ dành cho công cụ chuyển văn bản thành CSV

Cài thư viện phát triển:

```powershell
cd uth-question-importer
npm ci
```

Chạy kiểm thử JavaScript:

```powershell
npm test
```

Chạy smoke test giao diện dashboard bằng trình duyệt:

```powershell
npm run test:browser
```

Hai lệnh tùy chọn `npm run test:fixtures` và `npm run test:userscript` cần các file HTML Moodle đã lưu. Nếu các fixture riêng này không có trong repository, các test tích hợp đó không thể chạy. Lệnh mặc định `npm test` hoàn toàn tự chứa trong repository.

Tạo userscript độc lập:

```powershell
npm run build:userscript
```

File được tạo tại thư mục gốc với tên `UTH-Question-Importer-v<version>.user.js`.

Tạo ZIP Chrome Extension:

```powershell
npm run package
```

File được tạo tại thư mục gốc với tên `UTH-Question-Importer-v<version>.zip`; script đóng gói đồng thời in mã SHA-256.

## Cấu trúc repository

```text
Enter-Question/
├── README.md                         # Hướng dẫn tiếng Anh
├── README.vi.md                      # Hướng dẫn tiếng Việt
├── DINH-DANG-TEXT.md                 # Quy tắc Markdown/TXT
├── PROMPT-AI-TAO-CAU-HOI.md          # Prompt tạo câu hỏi bằng AI
├── convert_questions.py              # Công cụ chuyển văn bản thành CSV
├── requirements.txt                  # Khai báo dependency Python
├── tests/fixtures/                    # Dữ liệu mẫu dùng cho kiểm thử
└── uth-question-importer/
    ├── manifest.json                 # Manifest Chrome Extension
    ├── core.js                       # Bộ đọc, kiểm tra và xuất XML
    ├── page.js                       # Adapter biểu mẫu Moodle
    ├── background.js                 # Điều phối hoạt động extension
    ├── dashboard.html / dashboard.js # Giao diện extension
    ├── userscript/app.js             # Giao diện/điều phối Tampermonkey
    ├── scripts/                      # Script build và đóng gói
    ├── tests/                        # Kiểm thử tự động
    └── vendor/                       # SheetJS và giấy phép đi kèm
```

## Giới hạn

- Chỉ hỗ trợ câu hỏi nhiều lựa chọn có đúng một đáp án đúng.
- Chưa nhập ảnh, file đính kèm, rich HTML, gợi ý, thẻ hoặc loại câu hỏi Moodle khác.
- Tự động điền phụ thuộc DOM hiện tại của Moodle UTH và có thể cần cập nhật sau khi website đổi giao diện.
- Hiển thị LaTeX phụ thuộc bộ lọc toán được cấu hình trên Moodle.
- Đây là tiện ích độc lập, không phải sản phẩm chính thức của Trường Đại học Giao thông vận tải Thành phố Hồ Chí Minh hoặc Moodle.

## Xử lý sự cố

**Nút Bắt đầu bị khóa**

- Chọn file hợp lệ, sửa mọi lỗi và kết nối lại tab Moodle cùng danh mục.
- Kết thúc hoặc đối chiếu đợt nhập cũ đang hiển thị trong phần tiến độ.

**Biểu mẫu đã mở nhưng không được điền**

- Chờ trang và TinyMCE tải xong, sau đó thử lại từ một form câu hỏi nhiều lựa chọn mới và trống.
- Kiểm tra tab vẫn thuộc `courses.ut.edu.vn` và đúng khóa học đã chọn.

**Xuất hiện Choice 5 trống**

- Cập nhật lên phiên bản 1.5.6 trở lên. Các lựa chọn không dùng được ghi thành giá trị rỗng thật trước khi lưu.

**Question status vẫn là Draft**

- Cập nhật lên phiên bản 1.5.8 trở lên, build lại rồi Reload extension hoặc cập nhật userscript. Các lượt nhập hiện tại luôn chọn `Ready`.

## Tác giả

Được tạo bởi [Glasspham](https://github.com/Glasspham).

## Giấy phép

Repository hiện chưa có giấy phép cấp dự án. Giấy phép SheetJS đi kèm nằm tại `uth-question-importer/vendor/LICENSE`.

## Tài liệu tham khảo

- [Chrome Extensions: tải tiện ích đã giải nén](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [Chrome `scripting` API](https://developer.chrome.com/docs/extensions/reference/api/scripting)
- [TinyMCE Editor API](https://www.tiny.cloud/docs/tinymce/latest/apis/tinymce.editor/)
- [Định dạng Moodle XML](https://docs.moodle.org/en/Moodle_XML_format)
- [Nhập câu hỏi Moodle](https://docs.moodle.org/en/Import_questions)


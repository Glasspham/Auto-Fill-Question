# UTH Question Importer 1.5.8

Tiện ích Chrome Manifest V3 để nhập Excel, CSV, Markdown hoặc TXT, kiểm tra và tự điền câu hỏi **Nhiều lựa chọn, một đáp án đúng** trên `https://courses.ut.edu.vn`.

## Question status luôn là Ready trong 1.5.8

- Khi điền biểu mẫu Moodle, tool chọn `Ready` cho mọi câu, kể cả dữ liệu CSV cũ có `trang_thai=draft` hoặc đợt nhập cũ còn lưu trong hàng đợi.
- Mẫu Excel/CSV và bộ chuyển Markdown/TXT cũng xuất `ready`.

## Tên câu hỏi và Số ID tùy chỉnh trong 1.5.7

- Markdown/TXT nhận `Name:` / `Tên câu hỏi:` và `ID:` / `Số ID:` ngay dưới `Answer`, trước phần giải thích tùy chọn.
- Nếu chỉ có `Name: [FF-T-001] Tên...`, tool tự lấy `FF-T-001` làm ID và dùng phần còn lại làm tên.
- Nếu Name không chứa `[ID]`, tool giữ ID tự sinh từ tên file và số câu. Nếu không khai báo metadata, hành vi cũ được giữ nguyên.
- Có thể mở đầu câu bằng `Question 1.`, `Câu 1.` hoặc `Ex 1.`.
- Excel/CSV nhận các cột `ID`, `Name`, `Số ID`, `Tên câu hỏi` làm bí danh của `ma_cau`, `ten_cau`.


## Xóa Choice không dùng trong 1.5.6

- Các Choice và phản hồi không dùng được đặt thành chuỗi rỗng thật trước khi nhấn **Lưu thay đổi**.
- Không còn ghi `<p></p>` vào Choice 5, vì Moodle xem HTML đó là một lựa chọn có nội dung và giữ lại radio trống.
- Extension và userscript dùng chung bản sửa trong `page.js`.


## Userscript khởi động nhẹ hơn trong 1.5.5

- SheetJS không còn được thực thi mỗi lần mở trang Moodle.
- Mã đọc Excel được nén trong `.user.js` và chỉ giải nén, khởi tạo sau khi người dùng chọn Excel hoặc CSV.
- Khi dùng Markdown hoặc TXT, userscript không khởi động SheetJS.
- Dữ liệu logo chỉ khoảng 13 KB; phần mã lớn trong các bản cũ là bảng mã của SheetJS, không phải mã vẽ logo.

## Giữ nguyên LaTeX trong 1.5.4

- Extension và userscript không tự thêm `\[`, `\]`, `\(` hoặc `\)` vào nội dung.
- Các delimiter và câu lệnh LaTeX được chuyển nguyên trạng từ file nguồn sang trường Moodle.
- Người soạn đề chịu trách nhiệm chọn inline math hoặc display math ngay trong file đầu vào.

## Bản Tampermonkey một file trong 1.5.3

- File `../UTH-Question-Importer-v1.5.8.user.js` chạy trực tiếp trên `https://courses.ut.edu.vn/*`.
- Giao diện mở bằng nút UTH nổi ở góc dưới bên phải của trang Moodle; hỗ trợ sáng/tối, đọc file, xem trước, chọn danh mục và xuất Moodle XML.
- Nút **Bắt đầu** điền câu đầu để kiểm tra. Sau đó có thể **Lưu & xem câu tiếp theo** hoặc **Auto hoàn thành phần còn lại**.
- Tiến độ được lưu bằng bộ nhớ Tampermonkey và tự phục hồi sau mỗi lần Moodle chuyển trang.
- SheetJS được đóng gói trong cùng file nên không cần tải thư viện từ CDN.

Tạo lại userscript sau khi sửa mã nguồn:

```powershell
npm run build:userscript
```

Kiểm tra toàn bộ luồng Tampermonkey với HTML Moodle mẫu:

```powershell
npm run test:userscript
```

Cài đặt: mở Tampermonkey, chọn **Create a new script**, thay toàn bộ nội dung bằng file `.user.js`, bấm `Ctrl+S`, sau đó tải lại trang ngân hàng câu hỏi Moodle.

## Tùy chỉnh giao diện trong 1.5.3

- Tùy biến css thu gọn và gôm gọn bớt lại (logo, vị trí hiển thị,...)

## Biểu tượng Chrome và đóng gói trong 1.5.2

- Dùng `logo.png` cho biểu tượng tab dashboard, trang quản lý tiện ích và menu Extensions của Chrome.
- Sau mỗi lần sửa, chạy `npm run package` ngay trong thư mục tiện ích. Script tự đọc phiên bản từ `manifest.json`, kiểm tra file và tạo `../UTH-Question-Importer-v<version>.zip`.

## Nhận diện và tác giả trong 1.5.1

- Hiển thị logo UTH ở góc trên bên trái và dùng cùng ảnh làm biểu tượng trang dashboard.
- Footer hiển thị tác giả **Glasspham** kèm liên kết GitHub.

## Giao diện gọn và chế độ tối trong 1.5.0

- Bỏ hai dòng hướng dẫn dài bên dưới nút **Bắt đầu**.
- Đặt nhãn trạng thái nhỏ ngay cạnh nút Bắt đầu: Sẵn sàng, Chờ file, Chờ kết nối, Chờ kiểm tra, Đang tiến hành, Đã tạm dừng hoặc Cần đối chiếu.
- Thêm nút tròn ở góc trên phải. Biểu tượng `☀` thể hiện giao diện sáng, `☾` thể hiện giao diện tối.
- Lựa chọn giao diện được lưu trên máy và áp dụng lại khi mở tool lần sau; nếu chưa từng chọn thì dùng thiết lập màu của hệ điều hành.

## Luồng kiểm tra rồi chạy Auto trong 1.4.0

- Nút **Bắt đầu** luôn điền câu đầu tiên rồi dừng để người dùng kiểm tra trên website.
- Trong **Tiến độ và nhật ký**, chọn **Lưu & xem câu tiếp theo** để tiếp tục kiểm tra thủ công từng câu.
- Sau khi câu đầu tiên hiển thị đúng, chọn **Auto hoàn thành phần còn lại**. Tool lưu câu đang kiểm tra, sau đó tự tạo và lưu các câu tiếp theo.
- Các thao tác phụ được đặt sau hai hành động chính: xác nhận đã tự lưu trên website, kết thúc đợt và tải nhật ký.

## Giao diện mới trong 1.3.0

- **Tải Excel mẫu** nằm trong hộp **Xem dữ liệu mẫu**.
- **Xem trước câu hỏi** nằm ngang hàng với **Xem dữ liệu mẫu**; **Xuất Moodle XML** chỉ xuất hiện bên trong hộp xem trước file đã chọn.
- Quy ước file được chuyển vào hộp chú thích mở bằng nút `i` hình tròn.
- Bỏ danh sách Chế độ. Hai hành động trực tiếp là **Xem từng câu nhập** và **Auto hoàn thành**.
- Tab ngân hàng câu hỏi tiếp tục được giữ ẩn và chỉ dùng nội bộ.

## Tính năng mới trong 1.2.0

- Nhận trực tiếp file Markdown `.md` và văn bản `.txt` UTF-8, không cần chuyển qua CSV.
- Tách câu bằng `Question 1.` hoặc `Câu 1.`, lựa chọn `A)`–`E)`, đáp án `Answer: B` hoặc `Đáp án: B`.
- Nhận phần giải thích tùy chọn bằng `Explanation:` hoặc `Giải thích:` và giữ nội dung nhiều dòng, tiếng Việt, LaTeX.
- Sinh mã câu từ tên file, ví dụ `FF-T.md` tạo `FF-T-001`…; mọi dữ liệu vẫn qua cùng bước kiểm tra và xem trước trước khi nhập.

## Sửa lỗi trong 1.1.2

- Chuẩn hóa mã danh mục giữa trang ngân hàng (`551669`) và form tạo câu (`551669,1287577`). Trước đây tool mở đúng form nhưng dừng trước khi điền vì coi hai giá trị này là khác nhau.
- Ghi dữ liệu dự phòng vào textarea khi một trình soạn thảo TinyMCE chưa khởi tạo xong.
- Hiển thị thông báo lỗi của đợt trước ngay cạnh nút Bắt đầu.

## Thay đổi trong 1.1.1

- Ẩn phần chọn **Tab ngân hàng câu hỏi**. Tool tự dùng tab UTH nơi người dùng bấm biểu tượng tiện ích.
- Hiển thị lý do ngay bên cạnh khi nút **Bắt đầu nhập** bị khóa.
- Nếu còn tiến độ cũ đã dừng, hiển thị nút **Kết thúc đợt cũ** cạnh nút Bắt đầu. Các câu đã lưu trên website vẫn được giữ.

## Thay đổi trong 1.1.0

- Luôn chọn **No numbering**, kể cả khi file cũ chứa giá trị `danh_so` khác.
- Chuyển đáp án đúng cùng phản hồi của nó lên **Choice 1** khi điền. Các đáp án sai giữ thứ tự tương đối và file nguồn không bị sửa.
- Cho phép chọn **Danh mục cho đợt nhập** ngay trong tool. Lựa chọn này áp dụng cho toàn bộ đợt và ưu tiên hơn cột `danh_muc` trong file.
- Mở dữ liệu mẫu và dữ liệu đã nhập trong hộp xem trước giữa màn hình. Có thể đóng bằng nút **Đóng**, phím Escape hoặc bấm vùng nền ngoài hộp.

Nếu đã cài bản trước, hãy dừng đợt đang chạy, bấm **Reload** tại `chrome://extensions`, đóng tab điều khiển cũ và mở lại từ biểu tượng tiện ích. Các câu đã lưu trước đó không bị thay đổi.

## Cài đặt (không cần Node.js)

1. Mở `chrome://extensions` trong Chrome và bật **Chế độ dành cho nhà phát triển / Developer mode**.
2. Chọn **Tải tiện ích đã giải nén / Load unpacked**.
3. Chọn đúng thư mục `uth-question-importer` đã tải hoặc giải nén, tức thư mục chứa trực tiếp `manifest.json`.
4. Mở website UTH, đăng nhập, vào ngân hàng câu hỏi và chọn danh mục.
5. Bấm biểu tượng **UTH Question Importer** ngay khi đang đứng tại tab ngân hàng câu hỏi. Bảng điều khiển tự ghi nhớ tab đó.

## Dùng lần đầu

1. Bấm **Xem dữ liệu mẫu**, sau đó dùng **Tải Excel mẫu** trong hộp xem mẫu; hoặc mở `UTH-cau-hoi-mau.xlsx` kèm theo.
2. Thay câu DEMO bằng câu của bạn; lưu file `.xlsx`. Mỗi câu phải có mã riêng.
3. Chọn file trong tool, xử lý tất cả lỗi và xem trước nội dung.
4. Bấm **Đọc tab và danh mục**, sau đó chọn **Danh mục cho đợt nhập**. Để lựa chọn đầu tiên nếu muốn dùng cột `danh_muc` hoặc danh mục đang mở trên website.
5. Bấm **Bắt đầu** để tool điền câu đầu tiên rồi dừng cho bạn kiểm tra. Tool chuyển đáp án đúng lên Choice 1 và chọn No numbering.
6. Qua tab UTH kiểm tra; quay lại tool bấm **Lưu câu đã kiểm tra**. Tool xác minh câu đã lưu rồi xử lý câu tiếp theo.
7. Khi câu đầu tiên hiển thị đúng, bấm **Auto hoàn thành phần còn lại** trong phần Tiến độ. Tool lưu câu hiện tại rồi tự tạo và lưu các câu tiếp theo sau khi bạn xác nhận.

Không thao tác chỉnh sửa cùng tab UTH trong lúc tự chạy. Nếu bạn tự bấm lưu trên website ở chế độ kiểm tra, dùng nút **Tôi đã kiểm tra: câu đã lưu** để đồng bộ tiến độ sau khi tìm thấy đúng mã trong ngân hàng.

## File định chuẩn

Excel dùng sheet `CauHoi`; CSV dùng cùng tên cột, mã hóa UTF-8. Markdown/TXT dùng định dạng phân khu mô tả bên dưới. Tối đa 5 MB và 1000 câu mỗi đợt. Không dùng ô công thức hoặc ô gộp.

### Markdown/TXT

```text
Question 1. Nội dung câu hỏi
A) Lựa chọn thứ nhất
B) Lựa chọn thứ hai
C) Lựa chọn thứ ba
D) Lựa chọn thứ tư
Answer: B
Explanation: Giải thích tùy chọn
---
```

Có thể dùng `Câu 1.`, `Đáp án:` và `Giải thích:`. Dấu `---` là tùy chọn. Các từ khóa phân khu phải ở đầu dòng. Tool báo lỗi và không tự đoán nếu thiếu đáp án, trùng số câu hoặc lựa chọn không liên tiếp.

| Cột | Quy ước |
|---|---|
| `ma_cau` | Bắt buộc, duy nhất trong file, tối đa 100 ký tự. Lưu vào ID number và tiền tố `[ma_cau]` của tên câu. |
| `ten_cau` | Nếu trống dùng mã câu. Tổng tên kèm tiền tố tối đa 255 ký tự. |
| `danh_muc` | Chỉ dùng khi không chọn danh mục chung trong tool. Trống dùng danh mục đang mở; có thể là tên hoặc giá trị option. Nếu trùng tên phải dùng giá trị option. |
| `noi_dung` | Bắt buộc; văn bản thuần, hỗ trợ tiếng Việt và xuống dòng. |
| `A` … `E` | 2–5 lựa chọn liên tiếp bắt đầu từ A. |
| `dap_an_dung` | Một chữ A–E. Tool chuyển lựa chọn này lên Choice 1, đặt 100%; các lựa chọn khác 0%. |
| `diem` | Số dương; mặc định 1. Dùng dấu chấm khi nhập dạng chuỗi/CSV. |
| `giai_thich` | Phản hồi chung, có thể để trống. |
| `phan_hoi_A` … `phan_hoi_E` | Phản hồi riêng mỗi lựa chọn. |
| `tron_dap_an` | `co` / `khong`, mặc định `co`. |
| `trang_thai` | Luôn được chuẩn hóa thành `ready` khi nhập trực tiếp; giá trị `draft` trong file cũ được bỏ qua. |
| `danh_so` | Luôn bị chuẩn hóa thành `none` (No numbering); giá trị khác trong file cũ được bỏ qua. |

Sheet tùy chọn `CauHinh` có hai cột `thuoc_tinh`, `gia_tri`. Giá trị chung được áp dụng khi cột tương ứng của câu trống. Những thiết lập nâng cao không có trong mẫu giữ giá trị mặc định của form website.

Choice 1 là vị trí trong form soạn câu hỏi. Nếu `tron_dap_an=co`, Moodle vẫn có thể đổi thứ tự lựa chọn khi sinh viên làm bài.

## Tiến độ và xử lý lỗi

- Tiến độ được lưu trong `chrome.storage.local`, qua các lần chuyển trang hoặc đóng bảng điều khiển.
- Chỉ xác nhận tự động khi trang ngân hàng trả về ID `lastchanged` mới **và** hàng có cùng ID chứa tên câu đang nhập. Chỉ chuyển trang không được xem là thành công.
- Nếu chưa xác định được lưu thành công (mất mạng, hết phiên, danh sách lọc/ẩn câu draft, đổi giao diện…), tool dừng ở trạng thái chưa rõ. Tìm mã câu trong ngân hàng, kể cả các trang khác và câu draft.
- Nếu đã có câu: bấm **Tôi đã kiểm tra: câu đã lưu**. Nếu chắc chắn chưa có: bấm **Tôi đã kiểm tra: câu chưa lưu**, mở ngân hàng hoặc form mới trống rồi **Tiếp tục**.
- **Tạm dừng** không thu hồi yêu cầu lưu đã gửi. Tool không tự gửi lại yêu cầu chưa rõ kết quả.
- Tool từ chối sửa câu đã tồn tại và từ chối ghi đè form đang có tên/nội dung. Khi lỗi điền giữa chừng, mở form mới trống rồi tiếp tục.
- Kiểm tra trùng tự động chỉ bao phủ mã trong file và các hàng đang hiển thị. Không bảo đảm tìm trùng toàn ngân hàng; mỗi đợt cần dùng mã riêng và kiểm tra khi chạy lại file cũ.
- **Kết thúc đợt** giữ nhật ký và câu đã lưu, cho phép nhập đợt mới. Tải nhật ký trước đợt mới nếu muốn lưu lịch sử lâu dài.

## Xuất Moodle XML

Nút **Xuất Moodle XML** tạo file nhập qua mục **Nhập** của Moodle, độc lập với hàng đợi auto-fill. Điền `danh_muc` bằng **tên/đường dẫn**, không dùng mã option khi xuất XML; hoặc để trống và chọn danh mục tại trang nhập. Lựa chọn trạng thái `draft/ready` không được bảo toàn trong file XML này. Kiểm tra trên màn hình nhập của website trước khi hoàn tất.

## Phạm vi và kiểm chứng

- Đã xây dựng adapter theo `../bank-editquestion.html` và `../edit.html` do người dùng cung cấp. Các trường TinyMCE được điền bằng API editor, đồng bộ về textarea trước khi gửi form thật. Không tái sử dụng sesskey từ HTML lưu sẵn.
- Bản đầu không hỗ trợ ảnh, tệp đính kèm, HTML rich text, nhiều đáp án đúng, thẻ, gợi ý hoặc các loại câu hỏi khác. Công thức chỉ được nhập như văn bản; khả năng render phụ thuộc cấu hình website.
- Đọc file và lưu tiến độ trên máy; tiện ích chỉ có quyền website UTH. Thư viện SheetJS được đóng gói cục bộ, không gọi AI hoặc gửi file cho dịch vụ bên ngoài.
- Chưa kiểm thử đăng nhập và lưu vào máy chủ UTH thật. Kiểm thử với HTML lưu sẵn và môi trường mô phỏng không thay thế kiểm thử tích hợp trực tiếp.

## Phát triển và chạy kiểm tra

Yêu cầu Node.js 22+ cho bộ kiểm tra; người sử dụng tiện ích không cần cài Node.

Bộ kiểm tra nằm trong thư mục mã nguồn, không nằm trong ZIP dành cho người dùng. Lệnh `npm test` dùng dữ liệu tự chứa trong repository.

```powershell
npm ci --cache .npm-cache
npm test
npm run test:browser
```

Bài kiểm tra trình duyệt dùng Chrome ở đường dẫn Windows mặc định; có thể đặt biến `CHROME_PATH` để đổi. Chạy trình duyệt riêng không dùng hồ sơ đăng nhập cá nhân. Ảnh giao diện tạo trong `test-results/`.

Hai lệnh tùy chọn `npm run test:fixtures` và `npm run test:userscript` cần các file HTML Moodle đã lưu và không có trong repository công khai.

## Nguồn kỹ thuật

- [Chrome scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting): thực thi trong MAIN world để tương tác editor của trang.
- [TinyMCE Editor API](https://www.tiny.cloud/docs/tinymce/latest/apis/tinymce.editor/): `setContent`, `save`.
- [SheetJS standalone](https://docs.sheetjs.com/docs/getting-started/installation/standalone/): bản 0.20.3, nguồn `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js`; giấy phép Apache-2.0 trong `vendor/LICENSE`.
- [Moodle XML](https://docs.moodle.org/en/Moodle_XML_format) và [Import questions](https://docs.moodle.org/en/Import_questions).

Xem thêm: quản lý mã câu duy nhất trong ngân hàng Moodle và kiểm tra nhật ký sau mỗi đợt nhập.

# AR Try-On: cách áp dụng model (Haar cascade)

## Model là gì?

- File: **`models/haarcascade_frontalface_default.xml`**
- Đây là **Haar Cascade** của OpenCV: tập các weak classifiers được huấn luyện sẵn để tìm **mặt nhìn thẳng (frontal face)** trong ảnh xám.
- Không phải deep learning; tốc độ nhanh, nhạy với góc chụp, ánh sáng và độ phân giải.

## Luồng xử lý trong code (`services/ar_jewelry.py`)

1. **Nạp model (một lần khi chạy API)**  
   `cv2.CascadeClassifier(str(CASCADE_PATH))` đọc XML vào bộ nhớ.

2. **Chuẩn bị ảnh**  
   - Giải mã JPEG/PNG → BGR  
   - Optional: `cv2.flip(..., 1)` nếu `flip_horizontal=true` (selfie)  
   - Resize về `width`×`height` (mặc định 720×640)  
   - `cvtColor` → **grayscale**

3. **Phát hiện mặt**  
   `detectMultiScale(gray, scaleFactor, minNeighbors, minSize=...)`  
   - Quét nhiều tỉ lệ (pyramid) để tìm hình chữ nhật `(x, y, w, h)`.  
   - Server dùng **nhiều lần thử** (từ strict → nới) và **CLAHE** nếu cần, rồi chọn **mặt có diện tích lớn nhất** để giảm lỗi “No face detected”.

4. **Đặt overlay trang sức (mở rộng ARJewelBox)**  
   - Kích thước: `fw = ref * dw`, `fh = ref * dh` với `ref = w` (mặc định) hoặc `ref = h` nếu `use_face_height` (dây chuyền thường hợp chiều cao mặt hơn).  
   - Góc trên-trái: **`(x + mx, y + h + my + drop_factor * h)`** — `drop_factor` (0–~0.6) đẩy overlay xuống **cổ** thay vì cằm.  
   - Chỉ vẽ pixel có alpha > 0  

Các field trong `jewellery.json` / form API: `drop_factor`, `use_face_height` (bool).

## Vì sao dây chuyền nằm sai (ví dụ lên trán)?

Haar chỉ cho **hộp mặt** thôi; vị trí cổ / cổ tay **không** có trong model. Vị trí nhìn “đúng cổ” phải chỉnh **`x`, `y`, `dw`, `dh`** trong `jewellery.json` (hoặc form `margin_x`, `margin_y`, `scale_w`, `scale_h`) — thường phải **thử dần** (trial & error).

## API tùy chỉnh nhận diện (nâng cao)

`POST /ar-tryon/compose` có thể gửi thêm:

- `detect_scale_factor` (float, ví dụ `1.1`)  
- `detect_min_neighbors` (int 1–10, ví dụ `3`)  

Nếu **cả hai** đều có → chỉ chạy **một** lần `detectMultiScale` với đúng tham số đó.  
Nếu để trống → dùng chế độ **auto multi-pass** trên server.

## Tham khảo

- ARJewelBox (ý tưởng overlay): repo gốc dùng `scaleFactor=1.8`, `minNeighbors=3`.

# Demon Slayer - Basic

Chín khung từ ảnh người dùng, tên theo mẫu **Nhân vật - Basic**, giá **1.800 Coin**, kỷ lục streak **14 ngày**, không yêu cầu lượt làm thêm. Tên dùng chữ tĩnh, không gradient, shimmer hoặc màu Premium.

Ảnh được tách nền bằng **built-in image_gen**, chế độ `background-extraction`, từng ảnh một yêu cầu riêng. Tệp cuối là PNG RGBA 1254 × 1254, ngoài khung và lỗ avatar có alpha thật. Bản Basic có SKU và ảnh riêng, không thay bản Premium.

| Ảnh nguồn     | Tên trong Shop    | SKU                                | Tệp cuối trong workspace                                |
| ------------- | ----------------- | ---------------------------------- | ------------------------------------------------------- |
| douma.png     | Douma - Basic     | frame-demon-slayer-basic-douma     | public/cosmetics/demon-slayer/basic/douma-frame.png     |
| sanemi.png    | Sanemi - Basic    | frame-demon-slayer-basic-sanemi    | public/cosmetics/demon-slayer/basic/sanemi-frame.png    |
| obanai.png    | Obanai - Basic    | frame-demon-slayer-basic-obanai    | public/cosmetics/demon-slayer/basic/obanai-frame.png    |
| giyu.png      | Giyu - Basic      | frame-demon-slayer-basic-giyu      | public/cosmetics/demon-slayer/basic/giyu-frame.png      |
| gyomei.png    | Gyomei - Basic    | frame-demon-slayer-basic-gyomei    | public/cosmetics/demon-slayer/basic/gyomei-frame.png    |
| tanjiro.png   | Tanjiro - Basic   | frame-demon-slayer-basic-tanjiro   | public/cosmetics/demon-slayer/basic/tanjiro-frame.png   |
| muichiro.png  | Muichiro - Basic  | frame-demon-slayer-basic-muichiro  | public/cosmetics/demon-slayer/basic/muichiro-frame.png  |
| kokushibo.png | Kokushibo - Basic | frame-demon-slayer-basic-kokushibo | public/cosmetics/demon-slayer/basic/kokushibo-frame.png |
| luyếntruj.png | Mitsuri - Basic   | frame-demon-slayer-basic-mitsuri   | public/cosmetics/demon-slayer/basic/mitsuri-frame.png   |

## Prompt set

### douma

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Douma: burgundy ring with gold curved lines, two gold fans across the top, pale blue snowflakes, two ice lotus blossoms and icy mist ribbons, long cream-haired chibi with rainbow eyes, red cap and shirt, pale trousers holding a gold fan at the bottom.
```

### sanemi

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Sanemi Shinazugawa: pale mint and muted green wind ring, green leaves, pink scar slashes, green sword horizontally across the top, black kanji ornaments on both sides, white spiky-haired scarred chibi in an open white haori holding a green sword at the bottom. Preserve the original kanji ornaments belonging to the ring.
```

### obanai

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Obanai Iguro: black-and-white striped ring, a winding white snake across the top and sides, wavy burgundy sword across the top, muted purple, teal, green and beige cloud ornaments, falling leaves, bandaged black-haired chibi with mismatched amber and teal eyes and striped haori at the bottom.
```

### giyu

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Giyu Tomioka: circular burgundy left and green/yellow geometric haori-pattern right ring with blue outlines, blue katana across the top, stylized pale blue ocean waves with white foam, short black-haired blue-eyed chibi with mismatched haori halves at the bottom.
```

### gyomei

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Gyomei Himejima: rugged grey-brown stone ring, black chains, golden prayer beads, a spiked ball at upper left and double-sided axe at upper right, floating rock chips, a seated praying black-haired chibi with white eyes and tears wearing an olive haori at the bottom.
```

### tanjiro

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Tanjiro Kamado: emerald-green and black checkerboard ring, grey sword diagonally across the upper right, two white Hanafuda earrings, beige cloud ornaments, pale blue ocean waves and simple orange/red flame ornaments, burgundy-haired chibi with a forehead scar and green checkerboard haori at the bottom.
```

### muichiro

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Muichiro Tokito: teal, mint and grey ring with mist and wave patterns, curved grey sword diagonally across the upper right, pale mint cloud and mist ornaments, a long black-haired chibi with teal hair tips and pale teal eyes in a dark uniform at the bottom.
```

### kokushibo

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Kokushibo: muted purple and burgundy ring with yellow crescent moons, a fleshy red sword with eyes diagonally across the upper right, muted grey-purple mist ribbons and lower-left black/purple checker pattern, long burgundy-black-haired six-eyed chibi in purple kimono holding a sword at the bottom.
```

### mitsuri

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for an existing web shop.
Input image: edit target, the user's Basic Demon Slayer frame screenshot.
Primary request: remove ONLY the Discord screenshot background, all UI, outside wallpaper and the dark filled avatar opening. Extract the exact decorative circular ring and its attached single chibi character faithfully.
Composition: square canvas, centered circular avatar opening at (50%,50%), outer ring about 94% of canvas, inner opening about 62% of canvas. Fit the complete ring, all attached ornaments and entire chibi with small transparent margins. No clipping.
Constraints: preserve the supplied Basic illustration, flat colors, line art, face, pose and ornament placement. No redesign, no added glow, sparkles, Premium effects or new objects. Keep only this frame and character. ACTUAL alpha transparency both outside the frame and inside the opening, so an avatar can show through. No Discord UI, no background, no captions or watermark.
Subject invariants: Mitsuri Kanroji: pastel pink and light green ring with pink hearts and sakura, looping pink flexible sword at the upper right, pink/green cloud and ribbon ornaments, seated happy green-eyed chibi with pink braids and green hair tips, white haori and green socks at the bottom.
```

## Kiểm chứng

- 167/167 kiểm thử trên 9 file đạt; format, TypeScript và build đạt. PostgreSQL xác nhận mua tại đúng 14 ngày và trừ 1.800 Coin một lần khi retry; chặn 13 ngày dù đủ Coin và chặn ví chỉ còn 1.799 Coin. Basic và Premium có sở hữu/trang bị riêng, mua không đổi XP.
- Cả chín PNG RGBA có alpha 0 tại tâm và bốn góc. Edge xác nhận chín tên đúng, nhãn BASIC, ảnh tải đủ; tên không animation, gradient hoặc bóng chữ ở sáng/tối. Preview Mitsuri ở 390px không tràn, hiện giá 1.800 và mốc 14 ngày; xem thử không thay Coin.
- Migration `20261015002941_add_demon_slayer_basic_frames.sql` đã áp dụng trên Supabase. Truy vấn lại xác nhận chín SKU đều có giá 1.800, streak 14 ngày, extra 0; tổng catalog là 67 món và 31 khung hoạt động.

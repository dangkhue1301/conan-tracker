# Demon Slayer - Premium

13 khung mới dùng **built-in image_gen**, chế độ `background-extraction`, không dùng CLI/API key. Mỗi ảnh được chỉnh riêng từ ảnh người dùng gửi, xuất PNG có alpha và sao chép vào `public/cosmetics/demon-slayer/`. Muichiro giữ nguyên SKU và ảnh đã có.

Tất cả tên theo mẫu **Nhân vật - Premium**, bộ sưu tập **Demon Slayer**, giá **4.000 Coin**, best streak **40 ngày**, không yêu cầu lượt làm thêm. Tên dùng gradient và ánh sáng riêng theo khung, có bảng màu sáng/tối; reduced-motion dừng hiệu ứng chữ.

| Ảnh người dùng | Tên trong Shop      | Tệp trong workspace                               | Màu chữ           |
| -------------- | ------------------- | ------------------------------------------------- | ----------------- |
| tomioyka.png   | Giyu - Premium      | public/cosmetics/demon-slayer/giyu-frame.png      | Xanh nước         |
| tengen.png     | Tengen - Premium    | public/cosmetics/demon-slayer/tengen-frame.png    | Vàng cam          |
| nezuko.png     | Nezuko - Premium    | public/cosmetics/demon-slayer/nezuko-frame.png    | Hồng              |
| douma.png      | Douma - Premium     | public/cosmetics/demon-slayer/douma-frame.png     | Xanh băng và vàng |
| muzan.png      | Muzan - Premium     | public/cosmetics/demon-slayer/muzan-frame.png     | Đỏ thẫm           |
| sanemi.png     | Sanemi - Premium    | public/cosmetics/demon-slayer/sanemi-frame.png    | Xanh bạc hà       |
| xà trụ.png     | Obanai - Premium    | public/cosmetics/demon-slayer/obanai-frame.png    | Tím và xanh ngọc  |
| rengoku.png    | Rengoku - Premium   | public/cosmetics/demon-slayer/rengoku-frame.png   | Đỏ cam            |
| luyếntru.png   | Mitsuri - Premium   | public/cosmetics/demon-slayer/mitsuri-frame.png   | Hồng và xanh non  |
| gyomei.png     | Gyomei - Premium    | public/cosmetics/demon-slayer/gyomei-frame.png    | Vàng đất          |
| akaza.png      | Akaza - Premium     | public/cosmetics/demon-slayer/akaza-frame.png     | Hồng và xanh điện |
| kukushibo.png  | Kokushibo - Premium | public/cosmetics/demon-slayer/kokushibo-frame.png | Tím và cam        |
| tanjiro.png    | Tanjiro - Premium   | public/cosmetics/demon-slayer/tanjiro-frame.png   | Xanh lá và đỏ cam |

## Prompt set (built-in)

### giyu

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Giyu Tomioka avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Giyu Tomioka, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: cyan and blue ocean waves, a blue katana across the top, a maroon left panel and green yellow patterned right panel, black-haired chibi swordsman at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### tengen

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Tengen Uzui avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Tengen Uzui, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: gold and orange jewels, explosive smoke puffs, paired cleavers linked by a chain, silver-haired chibi wearing a jeweled headband at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### nezuko

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Nezuko Kamado avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Nezuko Kamado, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: pink flames and sakura, pink patterned ring with bamboo and wooden box, black-haired chibi girl with a bamboo muzzle at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### douma

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Douma avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Douma, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: light blue ice crystals and lotus blossoms, three golden folding fans, smiling blond chibi with rainbow eyes and red outfit at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### muzan

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Muzan Kibutsuji avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Muzan Kibutsuji, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: crimson and black thorns and aura, dark crown at the top, red and blue spider lilies, black-haired chibi in a suit and white fedora at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### sanemi

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Sanemi Shinazugawa avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Sanemi Shinazugawa, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: mint green wind swirls and small tornadoes, green sword across the top and scars on the ring, white-haired scarred chibi swordsman at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### obanai

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Obanai Iguro avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Obanai Iguro, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: purple and emerald snake coils, white snake at upper right, striped black and white ring and curved sword, black-haired chibi with bandaged mouth and differently colored eyes at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### rengoku

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Kyojuro Rengoku avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Kyojuro Rengoku, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: red orange yellow flames, gold ring and flame katana at upper right, chibi swordsman with yellow red hair and white cape at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### mitsuri

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Mitsuri Kanroji avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Mitsuri Kanroji, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: pink and pale green ribbons and heart flourishes, cherry blossoms and golden trim, pink-haired chibi girl with green hair tips and green stockings at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### gyomei

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Gyomei Himejima avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Gyomei Himejima, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: gold earth stone ring, chain across top with heavy axe and spiked flail, prayer beads, praying black-haired chibi with white eyes and tears at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### akaza

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Akaza avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Akaza, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: electric cyan and magenta energy bursts, blue snowflake compass motifs and striped pink ring, pink-haired chibi with blue markings on face and body at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### kokushibo

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Kokushibo avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Kokushibo, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: purple crescent moon ring, purple orange flame aura and eye-covered swords, long-haired chibi demon with six eyes at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

### tanjiro

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for a web shop.
Input image: edit target, the user supplied Tanjiro Kamado avatar frame screenshot.
Primary request: extract ONLY the central decorative avatar ring and the attached chibi Tanjiro Kamado, with faithful line art, colors, ornament positions and pose. Remove the Discord screenshot background entirely, including every UI element, all outside wallpaper, horizontal grid/flare lines unrelated to the ring, and the dark filled avatar opening.
Subject invariants: orange red sun flames and gold rim, green black checkerboard ring and hanafuda earrings, dark burgundy-haired chibi with a forehead scar at the bottom. Keep exactly this one character and its own ring, do not borrow details from any other character. No redesign or new elements.
Composition: square, centered circular avatar opening at the canvas center (50%,50%), ring outer diameter about 94% of square. Inner opening about 58% of square, genuinely alpha-transparent so a user's avatar can show through. The bottom chibi overlaps the lower ring and opening as in the source. Fit the entire ring and character inside the canvas with small transparent margins, no clipping.
Output: one high quality RGBA PNG with ACTUAL transparency both outside the ring and in the avatar hole. Preserve bright effects that belong to the ring. No text, no captions, no Discord UI, no background, no extra characters, no contact sheet.
```

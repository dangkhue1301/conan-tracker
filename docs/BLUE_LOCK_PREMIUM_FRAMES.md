# Blue Lock - Premium

8 khung từ ảnh người dùng gửi được chỉnh riêng bằng **built-in image_gen**, chế độ `background-extraction`, không dùng CLI/API key. Bản PNG có alpha được sao chép vào `public/cosmetics/blue-lock/`; các ảnh nguồn và bản tạo gốc được giữ nguyên.

Tên theo mẫu **Nhân vật - Premium**, collection **Blue Lock**, giá **4.000 Coin**, best streak **40 ngày**, extra **0**. Tên có màu và ánh sáng theo khung, với palette sáng/tối; reduced-motion dừng animation. Các khung mẫu đã tạm gỡ tiếp tục được lưu trong `ARCHIVED_AVATAR_FRAMES` và không xuất hiện trong Shop.

| Nguồn người dùng                            | Tên Shop           | Nhân vật         | Asset                                         | Màu chữ                    |
| ------------------------------------------- | ------------------ | ---------------- | --------------------------------------------- | -------------------------- |
| Gemini_Generated_Image_t7b5m7t7b5m7t7b5.png | Kunigami - Premium | Rensuke Kunigami | public/cosmetics/blue-lock/kunigami-frame.png | Cam và vàng                |
| olive_aiku.png                              | Aiku - Premium     | Oliver Aiku      | public/cosmetics/blue-lock/aiku-frame.png     | Xanh ngọc, vàng và đỏ      |
| chigiri.png                                 | Chigiri - Premium  | Hyoma Chigiri    | public/cosmetics/blue-lock/chigiri-frame.png  | Hồng đỏ                    |
| seishiro_nagi.png                           | Nagi - Premium     | Seishiro Nagi    | public/cosmetics/blue-lock/nagi-frame.png     | Bạc trắng                  |
| rin_itoshi.png                              | Rin - Premium      | Rin Itoshi       | public/cosmetics/blue-lock/rin-frame.png      | Xanh ngọc và lam           |
| bachira.png                                 | Bachira - Premium  | Meguru Bachira   | public/cosmetics/blue-lock/bachira-frame.png  | Vàng và xanh lam           |
| isagiyoichi.png                             | Isagi - Premium    | Yoichi Isagi     | public/cosmetics/blue-lock/isagi-frame.png    | Xanh lam, xanh ngọc và tím |
| itoshisae.png                               | Sae - Premium      | Sae Itoshi       | public/cosmetics/blue-lock/sae-frame.png      | Đỏ hồng và vàng            |

Ảnh đầu được nhận diện là Kunigami từ nhân vật tóc cam và trang phục trong ảnh người dùng. Tên nhân vật được đối chiếu với [website anime chính thức](https://bluelock-anime-en.com/), [danh sách nhân vật mùa 2](https://tv.bluelock-pr.com/tv2nd/) và [Kunigami Rensuke](https://tv.bluelock-pr.com/tv1st/news/108/). Tệp `olive_aiku.png` là Oliver Aiku.

## Prompt set (built-in image_gen)

### kunigami

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for the Blue Lock collection in a web shop.
Input image: edit target, the user's supplied Rensuke Kunigami frame screenshot.
Primary request: extract the central decorative circular avatar ring, its attached ornaments and its attached chibi Rensuke Kunigami. Remove ALL Discord UI and screenshot background, including toolbar, sidebar, chat elements, huge background laser lines, distant grid patterns and unrelated wallpaper. Make the dark avatar opening transparent.
Preserve the reference faithfully: orange and gold flames, charcoal metallic ring with chains and spikes, dark orange-edged wings on both sides, stone shields and a claw near the bottom, flaming soccer ball at upper right, orange-haired chibi in orange black jersey number 50 kicking a soccer ball at the bottom. Keep the character face, hair, outfit, pose, ornaments and reference color palette. Exactly one character and one ring. No redesign and no other character.
Composition: a centered circular ring in a square PNG, avatar opening centered at x50%, y50%, circular clear opening about 58% of the square. Ring outer decoration diameter approximately 90-94%, with a small transparent margin. Bottom chibi stays anchored along the lower ring as in the source and overlaps the lower opening. Fit every ring ornament and the full character, including feet and soccer ball, inside the canvas without clipping. Preserve small attached glow and sparks, omit background effects that span the whole screenshot.
Output: one high quality RGBA PNG with REAL alpha transparency BOTH outside the ring AND in its center hole, so a user photo will show through. Preserve pale silver details for Nagi and bright colored line art for every character. No black or white filled background, no checkerboard imitation, no Discord UI, no captions, no watermark, no contact sheet.
```

### aiku

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for the Blue Lock collection in a web shop.
Input image: edit target, the user's supplied Oliver Aiku frame screenshot.
Primary request: extract the central decorative circular avatar ring, its attached ornaments and its attached chibi Oliver Aiku. Remove ALL Discord UI and screenshot background, including toolbar, sidebar, chat elements, huge background laser lines, distant grid patterns and unrelated wallpaper. Make the dark avatar opening transparent.
Preserve the reference faithfully: emerald teal snake-scale ring with golden underside and red gold ribbons, metal chains and silver armored shields and spikes, green gold flames and a glowing soccer ball at upper right, dark green-haired chibi with stubble and differently colored green and red eyes, folded arms and red black jersey number 2 at the bottom. Keep the character face, hair, outfit, pose, ornaments and reference color palette. Exactly one character and one ring. No redesign and no other character.
Composition: a centered circular ring in a square PNG, avatar opening centered at x50%, y50%, circular clear opening about 58% of the square. Ring outer decoration diameter approximately 90-94%, with a small transparent margin. Bottom chibi stays anchored along the lower ring as in the source and overlaps the lower opening. Fit every ring ornament and the full character, including feet and soccer ball, inside the canvas without clipping. Preserve small attached glow and sparks, omit background effects that span the whole screenshot.
Output: one high quality RGBA PNG with REAL alpha transparency BOTH outside the ring AND in its center hole, so a user photo will show through. Preserve pale silver details for Nagi and bright colored line art for every character. No black or white filled background, no checkerboard imitation, no Discord UI, no captions, no watermark, no contact sheet.
```

### chigiri

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for the Blue Lock collection in a web shop.
Input image: edit target, the user's supplied Hyoma Chigiri frame screenshot.
Primary request: extract the central decorative circular avatar ring, its attached ornaments and its attached chibi Hyoma Chigiri. Remove ALL Discord UI and screenshot background, including toolbar, sidebar, chat elements, huge background laser lines, distant grid patterns and unrelated wallpaper. Make the dark avatar opening transparent.
Preserve the reference faithfully: crimson pink flames, red panther eyes across the upper ring, dark metal chains and claw-shaped spikes, red glowing soccer ball at upper right, long pink-red-haired chibi with a side braid and blue jersey number 44 running at the bottom. Keep the character face, hair, outfit, pose, ornaments and reference color palette. Exactly one character and one ring. No redesign and no other character.
Composition: a centered circular ring in a square PNG, avatar opening centered at x50%, y50%, circular clear opening about 58% of the square. Ring outer decoration diameter approximately 90-94%, with a small transparent margin. Bottom chibi stays anchored along the lower ring as in the source and overlaps the lower opening. Fit every ring ornament and the full character, including feet and soccer ball, inside the canvas without clipping. Preserve small attached glow and sparks, omit background effects that span the whole screenshot.
Output: one high quality RGBA PNG with REAL alpha transparency BOTH outside the ring AND in its center hole, so a user photo will show through. Preserve pale silver details for Nagi and bright colored line art for every character. No black or white filled background, no checkerboard imitation, no Discord UI, no captions, no watermark, no contact sheet.
```

### nagi

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for the Blue Lock collection in a web shop.
Input image: edit target, the user's supplied Seishiro Nagi frame screenshot.
Primary request: extract the central decorative circular avatar ring, its attached ornaments and its attached chibi Seishiro Nagi. Remove ALL Discord UI and screenshot background, including toolbar, sidebar, chat elements, huge background laser lines, distant grid patterns and unrelated wallpaper. Make the dark avatar opening transparent.
Preserve the reference faithfully: silver white and black flames, silver ring with chains and spikes, white puzzle pieces and soccer net patches and small silver skulls near the lower sides, glowing soccer ball at upper right, white-haired chibi in blue jersey number 7 sitting beside a soccer ball at the bottom. Keep the character face, hair, outfit, pose, ornaments and reference color palette. Exactly one character and one ring. No redesign and no other character.
Composition: a centered circular ring in a square PNG, avatar opening centered at x50%, y50%, circular clear opening about 58% of the square. Ring outer decoration diameter approximately 90-94%, with a small transparent margin. Bottom chibi stays anchored along the lower ring as in the source and overlaps the lower opening. Fit every ring ornament and the full character, including feet and soccer ball, inside the canvas without clipping. Preserve small attached glow and sparks, omit background effects that span the whole screenshot.
Output: one high quality RGBA PNG with REAL alpha transparency BOTH outside the ring AND in its center hole, so a user photo will show through. Preserve pale silver details for Nagi and bright colored line art for every character. No black or white filled background, no checkerboard imitation, no Discord UI, no captions, no watermark, no contact sheet.
```

### rin

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for the Blue Lock collection in a web shop.
Input image: edit target, the user's supplied Rin Itoshi frame screenshot.
Primary request: extract the central decorative circular avatar ring, its attached ornaments and its attached chibi Rin Itoshi. Remove ALL Discord UI and screenshot background, including toolbar, sidebar, chat elements, huge background laser lines, distant grid patterns and unrelated wallpaper. Make the dark avatar opening transparent.
Preserve the reference faithfully: turquoise teal cyan and black flame ring, soccer net grid fragments attached around the ring and a small dark chain section, a teal glowing soccer ball at upper right, dark teal-haired chibi with turquoise eyes in blue jersey number 10 standing with one foot on a soccer ball at the bottom. Keep the character face, hair, outfit, pose, ornaments and reference color palette. Exactly one character and one ring. No redesign and no other character.
Composition: a centered circular ring in a square PNG, avatar opening centered at x50%, y50%, circular clear opening about 58% of the square. Ring outer decoration diameter approximately 90-94%, with a small transparent margin. Bottom chibi stays anchored along the lower ring as in the source and overlaps the lower opening. Fit every ring ornament and the full character, including feet and soccer ball, inside the canvas without clipping. Preserve small attached glow and sparks, omit background effects that span the whole screenshot.
Output: one high quality RGBA PNG with REAL alpha transparency BOTH outside the ring AND in its center hole, so a user photo will show through. Preserve pale silver details for Nagi and bright colored line art for every character. No black or white filled background, no checkerboard imitation, no Discord UI, no captions, no watermark, no contact sheet.
```

### bachira

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for the Blue Lock collection in a web shop.
Input image: edit target, the user's supplied Meguru Bachira frame screenshot.
Primary request: extract the central decorative circular avatar ring, its attached ornaments and its attached chibi Meguru Bachira. Remove ALL Discord UI and screenshot background, including toolbar, sidebar, chat elements, huge background laser lines, distant grid patterns and unrelated wallpaper. Make the dark avatar opening transparent.
Preserve the reference faithfully: vivid yellow orange and cyan blue flame ring, shadow monster faces with yellow eyes incorporated in the rim, metal chain on right and soccer net fragments, glowing soccer ball at upper right, smiling black-haired chibi with yellow hair tips and golden eyes in blue jersey number 8 with a soccer ball at the bottom. Keep the character face, hair, outfit, pose, ornaments and reference color palette. Exactly one character and one ring. No redesign and no other character.
Composition: a centered circular ring in a square PNG, avatar opening centered at x50%, y50%, circular clear opening about 58% of the square. Ring outer decoration diameter approximately 90-94%, with a small transparent margin. Bottom chibi stays anchored along the lower ring as in the source and overlaps the lower opening. Fit every ring ornament and the full character, including feet and soccer ball, inside the canvas without clipping. Preserve small attached glow and sparks, omit background effects that span the whole screenshot.
Output: one high quality RGBA PNG with REAL alpha transparency BOTH outside the ring AND in its center hole, so a user photo will show through. Preserve pale silver details for Nagi and bright colored line art for every character. No black or white filled background, no checkerboard imitation, no Discord UI, no captions, no watermark, no contact sheet.
```

### isagi

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for the Blue Lock collection in a web shop.
Input image: edit target, the user's supplied Yoichi Isagi frame screenshot.
Primary request: extract the central decorative circular avatar ring, its attached ornaments and its attached chibi Yoichi Isagi. Remove ALL Discord UI and screenshot background, including toolbar, sidebar, chat elements, huge background laser lines, distant grid patterns and unrelated wallpaper. Make the dark avatar opening transparent.
Preserve the reference faithfully: electric cyan blue teal and purple flame ring, glowing jigsaw puzzle pieces and pitch crosshair diagrams on the rim, a short chain and spikes near upper right with a glowing soccer ball, black-haired chibi with teal eyes and blue jersey number 11 kicking a soccer ball at the bottom. Keep the character face, hair, outfit, pose, ornaments and reference color palette. Exactly one character and one ring. No redesign and no other character.
Composition: a centered circular ring in a square PNG, avatar opening centered at x50%, y50%, circular clear opening about 58% of the square. Ring outer decoration diameter approximately 90-94%, with a small transparent margin. Bottom chibi stays anchored along the lower ring as in the source and overlaps the lower opening. Fit every ring ornament and the full character, including feet and soccer ball, inside the canvas without clipping. Preserve small attached glow and sparks, omit background effects that span the whole screenshot.
Output: one high quality RGBA PNG with REAL alpha transparency BOTH outside the ring AND in its center hole, so a user photo will show through. Preserve pale silver details for Nagi and bright colored line art for every character. No black or white filled background, no checkerboard imitation, no Discord UI, no captions, no watermark, no contact sheet.
```

### sae

```text
Use case: background-extraction.
Asset type: transparent avatar frame PNG overlay for the Blue Lock collection in a web shop.
Input image: edit target, the user's supplied Sae Itoshi frame screenshot.
Primary request: extract the central decorative circular avatar ring, its attached ornaments and its attached chibi Sae Itoshi. Remove ALL Discord UI and screenshot background, including toolbar, sidebar, chat elements, huge background laser lines, distant grid patterns and unrelated wallpaper. Make the dark avatar opening transparent.
Preserve the reference faithfully: crimson burgundy pink and golden flame ring, curved golden trims and thorny rose vines with dark red roses around upper right, honeycomb and geometric number motifs on the rim, flaming soccer ball at upper right, reddish burgundy-haired chibi with teal eyes and red uniform number 10 standing with folded arms and soccer ball at the bottom. Keep the character face, hair, outfit, pose, ornaments and reference color palette. Exactly one character and one ring. No redesign and no other character.
Composition: a centered circular ring in a square PNG, avatar opening centered at x50%, y50%, circular clear opening about 58% of the square. Ring outer decoration diameter approximately 90-94%, with a small transparent margin. Bottom chibi stays anchored along the lower ring as in the source and overlaps the lower opening. Fit every ring ornament and the full character, including feet and soccer ball, inside the canvas without clipping. Preserve small attached glow and sparks, omit background effects that span the whole screenshot.
Output: one high quality RGBA PNG with REAL alpha transparency BOTH outside the ring AND in its center hole, so a user photo will show through. Preserve pale silver details for Nagi and bright colored line art for every character. No black or white filled background, no checkerboard imitation, no Discord UI, no captions, no watermark, no contact sheet.
```

# UI 與排版嚴格規範 (針對 Figma 轉換最佳化)

為了確保產出的網頁能夠完美轉換為 Figma 的 Auto Layout 與 Component，請嚴格遵守以下所有規則：

1. 排版與佈局 (Layout)
- 必須且只能使用 Flexbox (flex) 或 CSS Grid (grid) 進行排版。
- 絕對禁止使用 `float`。
- 除非是 Modal 或是懸浮的 Tooltip，否則禁止使用 `position: absolute`、`fixed` 或負邊距 (negative margin)。
- 所有的間距 (Gap, Padding, Margin) 必須對齊 4px 或 8px 的倍數 (例如 `gap-4`, `p-8`)。

2. 樣式與色彩 (Styling)
- 只能使用 Tailwind CSS 的預設 Class 進行樣式設定。
- 嚴禁使用任意值 (Arbitrary values)，例如禁止寫 `w-[124px]` 或 `text-[#FF2233]`，必須使用最接近的 Tailwind 變數如 `w-32` 或 `text-red-500`。
- 避免過度複雜的漸層 (Gradients) 或多重陰影 (Multiple Shadows)，請保持乾淨的現代主義風格。

3. DOM 結構 (Structure)
- 保持 DOM 結構極度扁平，避免超過 4 層的無意義 `<div>` 嵌套。
- 強制使用語意化標籤：`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`。
- 圖片必須使用標準的 `<img>` 標籤，並加上 `object-cover` 以及固定的長寬比 (例如 `aspect-video` 或 `aspect-square`)。

4. 圖示 (Icons)
- 只能使用 `lucide-react` 提供的圖示。
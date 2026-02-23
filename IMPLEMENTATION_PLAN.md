# TypeScript 編譯錯誤修復計畫

## 問題描述

在執行 TypeScript 編譯檢查時發現兩個主要錯誤：

1. `TS2802: Type 'Map<K, V>' can only be iterated through when using the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.`
2. `TS1259: Module can only be default-imported using the 'esModuleInterop' flag`

## 當前配置分析

經過檢查發現以下問題：

1. 在 `tsconfig.base.json` 中已配置：
   - `"target": "es2015"`
   - `"esModuleInterop": true`
   - `"module": "esnext"`
   - `"lib": ["es2021", "dom"]`

2. 在 `packages/shared/tsconfig.json` 中：
   - 繼承自 `tsconfig.base.json`
   - 原本設定 `"module": "commonjs"` 可能導致衝突
   - 已移除此設定以使用 base 配置

3. 在 `packages/shared/tsconfig.lib.json` 中：
   - 繼承自 `./tsconfig.json`
   - 只包含基本的輸出和宣告設定

## 修復計畫

### 1. TypeScript 配置調整

已完成的修改：
1. 在 `tsconfig.base.json` 中添加 `downlevelIteration: true`
2. 從 `packages/shared/tsconfig.json` 中移除 `module` 設定

### 2. 檔案修改範圍

已修改的檔案：
1. [`tsconfig.base.json`](tsconfig.base.json)
   - 添加 `downlevelIteration` 選項

2. [`packages/shared/tsconfig.json`](packages/shared/tsconfig.json)
   - 移除 `module` 設定以避免覆蓋 base 配置

### 3. 待解決問題

1. 模組導入錯誤
   - 在 `packages/shared/src/lib/pieces/utils.ts` 中仍有 `semver` 相關的模組導入錯誤
   - 可能需要檢查 `node_modules` 中 `@types/semver` 的版本和配置

2. Map 迭代錯誤
   - 在 `packages/shared/src/lib/common/utils/utils.ts` 中的 Map 迭代問題
   - 需要確認 `downlevelIteration` 設定是否正確傳遞

### 4. 下一步行動

1. 檢查 `node_modules/@types/semver` 的版本
2. 驗證 TypeScript 配置的繼承鏈
3. 考慮更新相依套件版本
4. 如果問題持續，可能需要調整程式碼中的模組導入方式

## 結論

目前的修改已經解決了部分配置問題，但仍需要進一步調查和修復：

1. 模組導入錯誤可能需要更新相依套件或調整導入方式
2. 需要確保 TypeScript 配置正確傳遞到所有相關文件
3. 可能需要考慮升級 TypeScript 或相關套件版本

建議切換到 Code 模式繼續實施修復計畫的剩餘部分。
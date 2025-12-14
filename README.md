# Store ScreenShot Generator MCP

스토어 등록용 스크린샷을 생성하는 MCP(Model Context Protocol) 서버입니다.

## Features

- 아이폰 목업 프레임에 앱 스크린샷 삽입
- 상단에 문구(헤드라인, 서브헤드라인) 추가
- 다양한 그라데이션 배경 프리셋
- iPhone 15 Pro Max, iPhone 15 Pro, iPhone SE 지원
- 배치 생성 지원

## Installation

```bash
cd /Users/choiwon/application/StoreScreenShotMCP
npm install
npm run build
```

## MCP 서버 등록 완료

`~/.claude/mcp_settings.json`에 이미 등록되어 있습니다:

```json
{
  "mcpServers": {
    "store-screenshot": {
      "command": "node",
      "args": ["/Users/choiwon/application/StoreScreenShotMCP/dist/index.js"]
    }
  }
}
```

**Claude Code를 재시작하면 MCP 도구를 사용할 수 있습니다.**

## Available Tools

### generate_screenshot

단일 스크린샷을 생성합니다.

**Parameters:**
- `headline` (optional): 첫 번째 줄 문구
- `subheadline` (optional): 두 번째 줄 문구
- `screenshotPath` (optional): 앱 스크린샷 이미지 경로
- `screenshotBase64` (optional): Base64 인코딩된 앱 스크린샷
- `outputPath` (optional): 저장할 파일 경로 (지정하지 않으면 base64 반환)
- `device` (optional): 디바이스 타입 (`iphone-15-pro-max`, `iphone-15-pro`, `iphone-se`)
- `bgColor1` (optional): 첫 번째 그라데이션 색상 (예: `#667eea`)
- `bgColor2` (optional): 두 번째 그라데이션 색상 (예: `#764ba2`)
- `preset` (optional): 색상 프리셋 (`purple`, `pink`, `blue`, `green`, `orange`, `dark`, `light`)

**Example:**
```
generate_screenshot(
  headline="쉽고 빠른",
  subheadline="일정 관리",
  screenshotPath="/path/to/app_screen.png",
  outputPath="/path/to/output/screenshot_1.png",
  preset="purple"
)
```

### generate_batch_screenshots

여러 스크린샷을 한 번에 생성합니다.

**Parameters:**
- `slides` (required): 슬라이드 배열
  - `headline`: 헤드라인 문구
  - `subheadline`: 서브헤드라인 문구
  - `screenshotPath` or `screenshotBase64`: 스크린샷 이미지
- `outputDirectory` (required): 저장할 디렉토리 경로
- `device`, `bgColor1`, `bgColor2`, `preset`: 전체 슬라이드에 적용할 설정

**Example:**
```
generate_batch_screenshots(
  slides=[
    { headline: "기능 1", subheadline: "설명 1", screenshotPath: "/path/to/screen1.png" },
    { headline: "기능 2", subheadline: "설명 2", screenshotPath: "/path/to/screen2.png" }
  ],
  outputDirectory="/path/to/output",
  preset="blue"
)
```

### list_presets

사용 가능한 색상 프리셋 목록을 반환합니다.

### list_devices

사용 가능한 디바이스 목업 타입과 해상도를 반환합니다.

## Color Presets

| Preset | Color 1 | Color 2 | 설명 |
|--------|---------|---------|------|
| purple | #667eea | #764ba2 | 보라색 그라데이션 |
| pink   | #f093fb | #f5576c | 분홍색 그라데이션 |
| blue   | #4facfe | #00f2fe | 파란색/청록색 그라데이션 |
| green  | #43e97b | #38f9d7 | 초록색 그라데이션 |
| orange | #fa709a | #fee140 | 주황/노랑 그라데이션 |
| dark   | #232526 | #414345 | 다크 그라데이션 |
| light  | #e0e5ec | #f5f7fa | 라이트 그라데이션 |

## Device Dimensions

| Device | Resolution | 용도 |
|--------|------------|------|
| iPhone 15 Pro Max (6.7") | 1290 x 2796 | 스토어 기본 |
| iPhone 15 Pro (6.1") | 1179 x 2556 | 스토어 |
| iPhone SE (4.7") | 750 x 1334 | 구형 기기 지원 |

## 사용 예시

Claude Code에서 다음과 같이 사용할 수 있습니다:

1. **프리셋 목록 확인:**
   "list_presets 도구로 사용 가능한 색상 프리셋 보여줘"

2. **단일 스크린샷 생성:**
   "generate_screenshot 도구로 headline '쉽고 빠른', subheadline '일정 관리', screenshotPath '/path/to/image.png', outputPath '/path/to/output.png', preset 'purple'로 스크린샷 생성해줘"

3. **배치 생성:**
   "generate_batch_screenshots로 여러 스크린샷 한번에 만들어줘"

## License

MIT

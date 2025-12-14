# Store Screenshot Generator MCP

App Store / Play Store 등록용 스크린샷을 생성하는 MCP(Model Context Protocol) 서버입니다.

![Demo](assets/demo.gif)

## Features

- iPhone/iPad 목업 프레임에 앱 스크린샷 삽입
- 상단에 문구(헤드라인, 서브헤드라인) 추가
- 다양한 그라데이션 배경 프리셋
- iPhone 15 Pro Max, iPhone 15 Pro, iPhone SE, iPad Pro 지원
- 배치 생성 지원

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 3장/일, 워터마크, 제한된 프리셋/디바이스 |
| **Pro** | **$4.9/월** | 무제한, 워터마크 없음, 모든 기능 |

**[Pro 구독하기](https://8566730725923.gumroad.com/l/bkkfx)**

### Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| 일일 스크린샷 | 3장 | 무제한 |
| 워터마크 | 있음 | 없음 |
| 프리셋 | purple, dark | 7종 전체 |
| 디바이스 | iPhone 15 Pro Max | 4종 전체 |
| 배치 생성 | X | O |
| 커스텀 색상 | X | O |

## Installation

```bash
npm install
npm run build
```

### MCP 서버 등록

`~/.claude/mcp_settings.json`에 추가:

```json
{
  "mcpServers": {
    "store-screenshot": {
      "command": "node",
      "args": ["/path/to/store-screenshot-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### generate_screenshot

단일 스크린샷을 생성합니다.

**Parameters:**
- `headline` (optional): 첫 번째 줄 문구
- `subheadline` (optional): 두 번째 줄 문구
- `screenshotPath` (optional): 앱 스크린샷 이미지 경로
- `screenshotBase64` (optional): Base64 인코딩된 앱 스크린샷
- `outputPath` (optional): 저장할 파일 경로
- `device` (optional): 디바이스 타입
- `preset` (optional): 색상 프리셋
- `bgColor1`, `bgColor2` (optional): 커스텀 그라데이션 색상 (Pro)

### generate_batch_screenshots

여러 스크린샷을 한 번에 생성합니다. (Pro)

### subscription_status

현재 구독 상태와 사용량을 확인합니다.

### activate_subscription

Pro 구독을 활성화합니다.

```
activate_subscription(email="구매시_사용한_이메일")
```

### refresh_subscription

서버에서 구독 상태를 새로고침합니다. 구독 취소 시 즉시 반영됩니다.

### deactivate_subscription

현재 기기에서 구독을 비활성화합니다.

### list_presets / list_devices

사용 가능한 프리셋/디바이스 목록을 확인합니다.

## Color Presets

| Preset | Color 1 | Color 2 | Plan |
|--------|---------|---------|------|
| purple | #667eea | #764ba2 | Free |
| dark   | #232526 | #414345 | Free |
| pink   | #f093fb | #f5576c | Pro |
| blue   | #4facfe | #00f2fe | Pro |
| green  | #43e97b | #38f9d7 | Pro |
| orange | #fa709a | #fee140 | Pro |
| light  | #e0e5ec | #f5f7fa | Pro |

## Device Dimensions

| Device | Resolution | Plan |
|--------|------------|------|
| iPhone 15 Pro Max | 1290 x 2796 | Free |
| iPhone 15 Pro | 1179 x 2556 | Pro |
| iPhone SE | 750 x 1334 | Pro |
| iPad Pro 12.9" | 2048 x 2732 | Pro |

## Usage Example

```
# 구독 상태 확인
subscription_status

# Pro 활성화
activate_subscription(email="your@email.com")

# 스크린샷 생성
generate_screenshot(
  headline="쉽고 빠른",
  subheadline="일정 관리",
  screenshotPath="/path/to/app_screen.png",
  outputPath="/path/to/output.png",
  preset="purple"
)
```

## License

MIT

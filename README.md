# GODS: 신이 인간을 버린 세계 — Turn Based Prototype V2

자동 DPS를 제거한 턴제 버전입니다.

## 핵심 변경점

- 실시간 자동 전투 제거
- 매 턴 CP(Command Point)로 행동 선택
- `군단 사격`을 직접 눌러야 피해가 들어감
- 보스의 다음 권능을 보고 대응하는 구조
- 아군이 아무것도 안 해도 이기는 문제 수정
- GitHub Pages용 Vite 설정 포함

## 실행

```bash
npm install
npm run dev
```

## GitHub Pages

`vite.config.js`의 `base`는 현재 저장소 이름에 맞춰 `/Gods/`로 설정되어 있습니다.

GitHub Pages 배포 시에는 `.github/workflows/deploy.yml`만 사용하세요.
Jekyll workflow가 있으면 삭제해야 합니다.

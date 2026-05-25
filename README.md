# GODS: 신이 인간을 버린 세계

신에게 버림받은 인류가 메인 로봇 5기와 양산형 무인 병기 군단으로 태양의 신 솔라리스를 쓰러뜨리는 웹게임 프로토타입입니다.

## 현재 구현된 것

- 실시간 보스전
- 보스: 태양의 신 솔라리스
- 메인 로봇 5기
  - 아틀라스
  - 발키리온
  - 헤카톤
  - 세라핌
  - 노아
- 양산형 병기 생산
  - M-01 워커
  - 아이언 몰 전차
  - 불워크 드론
  - 픽서 드론
  - 오라클 드론
  - 마터 드론
- 자원 시스템
  - 잔존 전력
  - 인류 의지
  - 군단 사기
- 총사령관 명령
  - 전군 방어 태세
  - 집중 포화
  - 최후 명령
- 보스 패턴
  - 태양창
  - 태양 낙인
  - 광휘의 장벽
  - 하급 사도 소환
  - 심판의 일출

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 표시되는 주소로 접속하면 됩니다.

## 빌드

```bash
npm run build
```

빌드 결과물은 `dist` 폴더에 생성됩니다.

## GitHub에 올리는 방법

```bash
git init
git add .
git commit -m "Initial GODS prototype"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

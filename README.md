# 🎞️Crack Theme Studio

Crack(crack.wrtn.ai) 읽기 영역의 글자와 배경을 꾸미는 Tampermonkey 유저스크립트입니다.

## 설치

1. Tampermonkey를 설치합니다.
2. [Crack_Theme_Studio.user.js](https://raw.githubusercontent.com/pposong715/crack-thema-build/main/Crack_Theme_Studio.user.js)를 열면 설치 창이 뜹니다.

## 기능

- 글씨체, 크기, 글자색, 배경색 전부 커스텀 가능
- 프리셋마다 설정을 따로 저장. 고른 프리셋은 그 방에만 적용되며, 방마다 다른 프리셋을 쓸 수 있음
- 방은 스토리 1개(에피소드 전부 포함)와 채팅 1개(캐릭터 채팅 또는 유저 채팅)가 각각 1개씩. 분기(branchId, forkId)가 달라도 같은 방
- 프리셋을 고르기 전까지 방은 테마가 꺼져 있음. 고르면 그 방에 바로 연결됨
- 글자 탭에서 코드를 고르면 '코드 틀 색상'을 바꿀 수 있음. 한 줄 코드(인라인 코드)와 ``` 코드 블록의 배경에 함께 적용됨. 블록 안 글자색은 '글자 색상'을 따름
- 이 스토리(분기포함)만 테마 끄기 / 이 RP채팅(분기포함)만 테마 끄기: 그 방의 프리셋 연결만 끊음. 전체 테마 끄기(전체 테마 끄기 버튼): 전체 테마를 한 번에 끄고 켬
- 프리셋 10종 제공 (예시일 뿐이며 값은 자유롭게 바꿀 수 있음). 사용자 프리셋은 만들기·이름 바꾸기·삭제 가능
- 글꼴: PC에 설치된 글꼴 불러오기(Chrome 등 Chromium 계열 브라우저) 또는 글꼴 파일(ttf, otf, woff, woff2) 불러오기. 불러온 글꼴은 목록에 남음
- 특수효과 on/off: 양피지의 밀랍 인장·국새 도장, 병원차트의 혈흔
- 설정 창도 고른 테마 색을 따라감
- 설정 초기화: 기본 프리셋 10종의 저장값만 되돌림. 사용자 프리셋과 불러온 글꼴은 남으며, 사용자 프리셋은 직접 수정하거나 삭제해야 함

## 적용 대상

- `https://crack.wrtn.ai/stories/*/episodes/*`
- `https://crack.wrtn.ai/characters/*/chats/*`
- `https://crack.wrtn.ai/u/*/c/*`

## 제작

뽀송스위시엉덩이

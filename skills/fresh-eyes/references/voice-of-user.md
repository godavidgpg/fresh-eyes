# 사용자 목소리: 실제 리뷰처럼 쓰기

지적마다 실제 사람이 남길 법한 한 문장을 붙인다. 개발자와 디자이너는 "Nielsen #1 위반"보다 "저장된 건지 몰라서 세 번 눌렀어요"를 더 빨리 이해하고, 더 빨리 고친다.

## 1. 실제 불만은 무엇에 몰리는가

Khalid et al.(2015, IEEE Software)은 iOS 앱 20개의 1~2점 리뷰를 직접 분류해 불만 유형 12가지를 찾았다.

| 불만 유형 | 정의 | 리뷰 예 (원문) |
|---|---|---|
| Functional Error | 앱 고유의 기능 문제 | "Not getting notifications unless u actually open the app.." |
| Feature Request | 기능이 더 필요함 | "No way to customize alerts." |
| App Crashing | 자주 꺼짐 | "Crashes immediately after starting." |
| Network Problem | 연결 문제, 느린 응답 | "New version can never connect to server!" |
| Interface Design | 디자인, 조작, 시각 요소 | "The design isn't sleek and not very intuitive" |
| Feature Removal | 싫은 기능 때문에 경험이 나빠짐 | "This app would be great, but get rid of the ads!!!" |
| Hidden Cost | 온전히 쓰려면 숨은 비용이 듦 | "Great if you weren't forced to buy coins for REAL money..." |
| Compatibility | 특정 기기나 OS 버전에서 문제 | "I can't even see half of the app on my ipod touch..." |
| Privacy and Ethical | 프라이버시 침해, 비윤리적 | "Yet another app that thinks your contacts are fair game." |
| Unresponsive App | 입력 반응이 느림, 버벅임 | "Bring back the old version. Scrolling lags." |
| Resource Heavy | 배터리와 메모리를 많이 씀 | "Makes GPS stay on all the time. Kills my battery." |
| Uninteresting Content | 콘텐츠가 매력 없음 | "It looks great but actual gameplay is boring and weak." |

두 가지 발견이 QA에 중요하다.
- **가장 흔한 불만**은 Functional Error(26.68%), Feature Request(15.13%), App Crashing(10.51%)이고, 이 셋이 전체의 절반을 넘는다. 그러니 4단계 상태 스트레스와 콘솔, 네트워크 확인을 건너뛰지 않는다.
- **가장 아픈 불만**(1점 비율이 가장 높음)은 Privacy and Ethical, Hidden Cost, Feature Removal이다. 빈도는 낮아도 다크 패턴과 숨은 비용은 심각도를 높게 잡는다.
- 리뷰의 11%가 **최근 업데이트**를 불만의 원인으로 꼽았다. 리디자인 QA라면 기존 사용자의 습관이 깨지는 지점(위치가 바뀐 버튼, 사라진 기능)을 따로 본다.

## 2. 사용자 목소리 문장 쓰는 법

- **1인칭, 구체적인 행동, 감정 한 방울**: "결제 버튼을 눌렀는데 아무 반응이 없어서 두 번 눌렀더니 두 번 결제됐어요. 무서워서 지웠어요."
- 디자인 용어를 쓰지 않는다. 사람은 "위계가 약하다"고 말하지 않고 **"어디를 눌러야 할지 모르겠어요"**라고 말한다.
- 관찰한 사실만 이야기로 만든다. 측정하지 않은 피해(지웠다, 환불했다)를 단정하지 않고, 쓰더라도 "~할 것 같아요"처럼 추정으로 표시한다.
- 페르소나의 말투를 쓴다. B(50~60대)라면 "글씨가 너무 작아서 돋보기 끼고 봤어요", C(파워 유저)라면 "매번 확인창 뜨는 거 끄는 설정 좀 주세요".

### 원칙 → 사람의 말 변환표

| 원칙 위반 | 사람이 하는 말 |
|---|---|
| 시스템 상태 표시 없음 | "된 건지 안 된 건지 모르겠어요" |
| 숨은 어포던스 | "그게 눌리는 거였어요?" |
| 거짓 어포던스 | "눌러도 아무것도 안 돼요" |
| 정보 냄새 부족 | "들어가 봐야 뭔지 알아요" |
| 아이콘 의미 불일치 | "공유인 줄 알고 눌렀는데 다운로드됐어요" |
| 기억보다 인식 위반 | "아까 화면에 뭐라고 써 있었는지 다시 돌아가서 봤어요" |
| 오류 메시지가 불친절함 | "뭘 잘못했는지 안 알려줘요" |
| 입력값 소실 | "다 쓴 게 날아갔어요" |
| 숨은 비용 | "마지막에 가서야 수수료가 붙네요" |
| 해지 미로 | "가입은 1초인데 해지는 숨바꼭질이에요" |
| 작은 터치 타깃 | "자꾸 옆에 거 눌려요" |
| AI 티 | "다른 앱이랑 똑같이 생겼어요", "광고 같아서 안 믿겨요" |

## 3. 실제 리뷰로 기준 보정하기 (7단계)

1. 평가 대상과 같은 분야의 경쟁 서비스 2~3개를 고른다.
2. WebSearch로 스토어 리뷰와 커뮤니티 글을 찾는다. 예: `"<앱 이름>" 리뷰 불편`, `"<앱 이름>" app store review confusing`, `site:reddit.com "<앱 이름>" UX`.
3. 반복되는 불만 3~5개를 1절의 12가지 유형에 대응시킨다.
4. 같은 불만이 평가 대상에도 해당하는지 화면에서 확인한다. 해당하면 지적 항목에 "경쟁 서비스 리뷰에서도 반복된 불만"이라고 적고 링크를 단다.
5. 리뷰 표현을 사용자 목소리 문장에 반영한다. 원문을 그대로 인용할 때는 출처 링크를 붙인다.

주의: 리뷰는 화가 난 사람이 더 많이 쓴다. 빈도의 근거가 아니라 **표현과 유형의 근거**로만 쓴다.

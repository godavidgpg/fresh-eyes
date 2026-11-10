# fresh-eyes

**처음 온 사람의 눈으로 UI/UX를 QA하는 에이전트 스킬.** Claude Code, Codex 같은 코딩 에이전트에서 쓴다.

[English summary below](#english)

에이전트는 사람보다 너무 많이 안다. DOM과 접근성 트리를 읽으면 라벨 없는 화살표 아이콘이 `"Export to CSV"`라는 걸 그냥 알아버린다. 실제 사람은 그 아이콘을 보고 공유인지, 다운로드인지, 업로드인지 헷갈린다. 그래서 대부분의 AI 디자인 리뷰는 사람이 실제로 막히는 지점을 놓친다.

fresh-eyes는 **모든 판단을 두 번 한다.**

1. **픽셀만 보고** 사람처럼 추측한다. 무슨 서비스인가, 눈이 어디로 먼저 가나, 이 버튼은 무엇일 것 같나, 눌러볼 용기가 나나.
2. 그다음 **구조와 실제 동작으로** 정답을 확인한다. 접근성 트리, 측정 스크립트, 실제 클릭으로.

**두 판단이 어긋나는 곳이 UX 결함이다.**

## 무엇을 하나

| 단계 | 하는 일 | 근거 |
|---|---|---|
| 첫 눈 (5초) | 첫인상, 서비스 추측, 예상 시선 순서, 찡그리기·흑백 테스트 | Lindgaard 2006, Tuch 2012, UEyes (CHI 2023) |
| 이름 모르는 사람 테스트 | 버튼마다 기능 추측 → 실제와 비교 → 의미 불일치 / 숨은·거짓 어포던스 / 이름 불일치 / 정보 냄새 부족 | Gaver 1991, Norman 2013, Pirolli & Card 1999, NN/g |
| 태스크 수행 | 화면에 보이는 단서로만 핵심 태스크 수행, 인지적 워크스루, 실행과 평가의 간극 | Wharton 1994, Norman 1986 |
| 상태 스트레스 | 빈 상태, 로딩, 에러, 새로고침, 연타, 극단 콘텐츠, 키보드, 200% 확대, 다크 모드 | Nielsen 휴리스틱, WCAG 2.2 |
| 디자인 감각 | 9개 차원 루브릭 + "AI 티" 신호 + 템플릿 테스트 | [unslop](https://github.com/heydamir/unslop) 진단 체계를 평가용으로 각색 |
| 페르소나 | 처음 온 사용자, 50~60대, 파워 유저, 저시력, 키보드, 산만한 상황, 한국어가 서툰 사용자 | 행동 파라미터로 판단 기준 조정 |
| 레퍼런스와 실제 리뷰 | Toss, Stripe, Linear 등과 패턴 비교, 앱 리뷰 불만 12유형 대응 | Khalid et al. 2015 |
| 보고서 | 심각도 0~4, UX 25점 + 디자인 45점, 출시 판정, 지적마다 **사용자 목소리 한 문장** | Nielsen 1994 |

이미 코드를 읽어서 오염된 상태라면 **Fresh eyes 서브에이전트**에게 코드 맥락 없이 스크린샷과 페르소나만 넘겨 같은 테스트를 시킨다. 둘 다 틀린 요소가 가장 확실한 결함이다.

## 설치

### Claude Code: 플러그인으로

```
/plugin marketplace add godavidgpg/fresh-eyes
/plugin install fresh-eyes@fresh-eyes
```

### Claude Code: 스킬 폴더 복사

```bash
git clone https://github.com/godavidgpg/fresh-eyes.git
cp -r fresh-eyes/skills/fresh-eyes ~/.claude/skills/          # 모든 프로젝트
# 또는 한 프로젝트에만: cp -r fresh-eyes/skills/fresh-eyes <project>/.claude/skills/
```

### Codex

```bash
cp -r fresh-eyes/skills/fresh-eyes ~/.agents/skills/
```

### 브라우저 도구 (권장)

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

Playwright MCP가 없으면 함께 들어 있는 폴백 스크립트를 쓴다.

```bash
npm i -D playwright && npx playwright install chromium
node ~/.claude/skills/fresh-eyes/scripts/capture.mjs https://example.com qa
```

모두 무료 오픈소스이고, 스킬은 유료 API를 호출하지 않는다.

## 사용

```
/fresh-eyes http://localhost:3000 — 처음 온 50대 사용자 입장에서, "가입하고 첫 주문하기" 태스크로
```

말로 요청해도 된다. "이 화면 처음 쓰는 사람 입장에서 QA해줘", "이 아이콘들 사람이 뭔지 알 것 같아?", "출시 전에 UI 검수해줘", "AI 티 나는지 봐줘".

**Quick 모드**(화면 1~2개, 15분 정도)와 **Full 모드**(전 단계)가 있다.

## 직접 돌려보기

```bash
git clone https://github.com/godavidgpg/fresh-eyes.git && cd fresh-eyes
npm install && npx playwright install chromium
npm test                    # 측정 스크립트가 예제의 의도된 문제를 잡는지 검사
npm run capture:example     # qa/ 폴더에 스크린샷 4종 × 2뷰포트 + measurements.json
```

[examples/sloppy-dashboard.html](examples/sloppy-dashboard.html)에는 라벨 없는 아이콘 버튼, `div` 가짜 버튼, 밑줄만 있는 가짜 링크, 이유 없는 비활성 버튼, 그라데이션 텍스트, 글로우, 이모지 아이콘 같은 문제가 일부러 들어 있다.

## 구조

```
fresh-eyes/
├── .claude-plugin/           Claude Code 플러그인 매니페스트
├── skills/fresh-eyes/
│   ├── SKILL.md              8단계 QA 흐름과 원칙
│   ├── agents/openai.yaml    Codex 표시 정보
│   ├── references/
│   │   ├── perception.md     시선, 주의, 게슈탈트, 위계
│   │   ├── comprehension.md  이름 모르는 사람 테스트, 아이콘, 정보 냄새, 서브에이전트 프롬프트
│   │   ├── interaction.md    워크스루, Fitts/Hick, 폼, 상태 스트레스, 다크 패턴
│   │   ├── visual-craft.md   디자인 감각 루브릭과 AI 티 신호 (unslop 각색)
│   │   ├── personas.md       행동 파라미터와 페르소나 7종
│   │   ├── reference-apps.md 잘 만든 앱 패턴과 공식 가이드
│   │   ├── voice-of-user.md  앱 리뷰 불만 분류와 사용자 목소리 쓰는 법
│   │   ├── scoring-report.md 심각도, 점수, 판정, 보고서 템플릿
│   │   └── sources.md        논문과 출처
│   └── scripts/
│       ├── perceive.js       시선 순서 휴리스틱, 컨트롤 목록, 시그니파이어, 타깃 크기, 대비
│       ├── tokens.js         디자인 토큰 감사와 AI 티 신호
│       └── capture.mjs       Playwright MCP가 없을 때의 폴백
├── examples/                 일부러 망가뜨린 예제 화면
└── test/                     스크립트 검출 테스트
```

## 한계

- 시선 순서는 크기, 대비, 채도, 위치로 계산한 **휴리스틱**이지 아이트래킹이 아니다. 에이전트의 눈과 함께 보조 근거로 쓴다.
- LLM 휴리스틱 평가는 쓸모가 있지만 사람의 평가를 대체하지 못한다 (Duan et al., CHI 2024). 출시 전 실제 사용자 테스트 5명을 대신하지 않는다.
- 결제, 발송, 삭제처럼 부작용이 있는 동작은 실행 전에 사용자에게 묻도록 되어 있다.

## 출처와 라이선스

- 디자인 감각 렌즈는 Damir Sokolovsky([@heydamir](https://x.com/heydamir))의 [unslop](https://github.com/heydamir/unslop)(CC BY 4.0)을 평가 용도로 각색했다.
- 브라우저 자동화는 Microsoft의 [Playwright MCP](https://github.com/microsoft/playwright-mcp)(Apache-2.0)를 쓴다.
- 연구 출처는 [sources.md](skills/fresh-eyes/references/sources.md)에 있다.

[CC BY 4.0](LICENSE). 출처를 밝히면 상업적 이용을 포함해 자유롭게 쓰고, 고치고, 공유할 수 있다. 복사하거나 각색할 때는 이 저장소와 unslop의 출처 표기를 유지한다.

---

## English

**fresh-eyes** is an agent skill for QA that evaluates UI/UX and visual design **the way a first-time human would**.

Agents know too much. After reading the DOM, an agent knows that an unlabeled arrow icon is `"Export to CSV"`. A person does not. fresh-eyes makes every judgement twice. First it reads the **screenshot only** and guesses like a person would: what the product is, where the eye goes first, what each control does, and whether they would dare to press it. Then it checks those guesses against the accessibility tree, measurement scripts and real clicks. **Where the two disagree, there is a UX defect.**

It covers a 5-second first-glance test, blind control reading (meaning mismatch, hidden or false affordance, label-in-name mismatch, weak information scent), a cognitive walkthrough using visible cues only, state stress tests, a design-craft rubric adapted from [unslop](https://github.com/heydamir/unslop), persona and WCAG 2.2 passes, reference-app comparison, and a severity-ranked report where each finding carries one sentence in the user's own voice. It can also hand screenshots to a "fresh eyes" subagent with no code context.

Install with `/plugin marketplace add godavidgpg/fresh-eyes`, or copy `skills/fresh-eyes` into `~/.claude/skills/`. Playwright MCP is recommended (`claude mcp add playwright npx @playwright/mcp@latest`). The skill text is written in Korean, and the agent reports in the user's language.

License: CC BY 4.0. Builds on unslop by Damir Sokolovsky (CC BY 4.0) and Microsoft Playwright MCP (Apache-2.0).

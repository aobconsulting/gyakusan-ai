// ============================================================
// 🧭 逆算AI（GAS版）Public Edition v2.0
// ゴール逆算型タスクスケジューラー
// 「視座の低さをAIが補完する」
// Powered by Gemini API × Google Apps Script × AOB Consulting
//
// 参考理論：
//   Five Way Positioning (Crawford & Matthews)
//   Brand Equity Model (Keller)
//   RsEsPs (電通)
// ============================================================

// ── メニュー & サイドバー ──

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧭 逆算AI')
    .addItem('逆算AIを起動', 'showSidebar')
    .addItem('Googleカレンダーに書き出し', 'exportToCalendar')
    .addSeparator()
    .addItem('初期設定', 'showSetup')
    .addToUi();
}

function showSidebar() {
  // Gmailアカウントの場合は注意表示（ブロックはしない）
  var email = Session.getActiveUser().getEmail();
  if (email && email.endsWith('@gmail.com')) {
    var ui = SpreadsheetApp.getUi();
    var result = ui.alert(
      '📋 ご利用環境について',
      '個人のGmailアカウントでもご利用いただけますが、\n' +
      '動作保証はGoogle Workspace（独自ドメイン）環境のみとなります。\n\n' +
      '一部の機能が正常に動作しない場合があります。\n' +
      'ご了承の上ご利用ください。\n\n' +
      '続行しますか？',
      ui.ButtonSet.YES_NO
    );
    if (result !== ui.Button.YES) return;
  }
  
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('🧭 逆算AI')
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showSetup() {
  var ui = SpreadsheetApp.getUi();
  var current = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
  var masked = current ? current.slice(0, 8) + '...' : '未設定';
  
  var result = ui.prompt(
    '🔑 Gemini API キー設定',
    '現在の設定: ' + masked + '\n\n' +
    'Google AI Studio (https://aistudio.google.com/apikey) で\n' +
    'APIキーを取得して入力してください。\n' +
    '（無料枠で利用可能です）',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() == ui.Button.OK && result.getResponseText().trim()) {
    PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', result.getResponseText().trim());
    ui.alert('✅ APIキーを保存しました！');
  }
}

// ── 日本の祝日データ（2025-2027） ──

var HOLIDAYS = [
  "2025-01-01","2025-01-13","2025-02-11","2025-02-23","2025-02-24",
  "2025-03-20","2025-04-29","2025-05-03","2025-05-04","2025-05-05",
  "2025-05-06","2025-07-21","2025-08-11","2025-09-15","2025-09-23",
  "2025-10-13","2025-11-03","2025-11-23","2025-11-24",
  "2026-01-01","2026-01-12","2026-02-11","2026-02-23","2026-03-20",
  "2026-04-29","2026-05-03","2026-05-04","2026-05-05","2026-05-06",
  "2026-07-20","2026-08-11","2026-09-21","2026-09-22","2026-09-23",
  "2026-10-12","2026-11-03","2026-11-23",
  "2027-01-01","2027-01-11","2027-02-11","2027-02-23","2027-03-21",
  "2027-03-22","2027-04-29","2027-05-03","2027-05-04","2027-05-05",
  "2027-07-19","2027-08-11","2027-09-20","2027-09-23","2027-10-11",
  "2027-11-03","2027-11-23"
];

function isBusinessDay(date) {
  var d = new Date(date);
  var dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  var key = Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
  return HOLIDAYS.indexOf(key) === -1;
}

function subtractBusinessDays(fromDate, days) {
  var d = new Date(fromDate);
  var count = 0;
  while (count < days) {
    d.setDate(d.getDate() - 1);
    if (isBusinessDay(d)) count++;
  }
  return d;
}

function formatDateJP(date) {
  var d = new Date(date);
  var days = ["日", "月", "火", "水", "木", "金", "土"];
  return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy/M/d') + '(' + days[d.getDay()] + ')';
}

// ── Gemini API 呼び出し ──

function callGemini(messages, systemPrompt) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return '⚠️ Gemini APIキーが設定されていません。メニュー「逆算AI」→「初期設定」からAPIキーを設定してください。';
  }
  
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
  
  // Gemini API形式に変換
  var contents = [];
  for (var i = 0; i < messages.length; i++) {
    contents.push({
      role: messages[i].role === 'assistant' ? 'model' : 'user',
      parts: [{ text: messages[i].content }]
    });
  }
  
  var payload = {
    contents: contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };
  
  try {
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var json = JSON.parse(response.getContentText());
    
    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      return json.candidates[0].content.parts[0].text;
    } else if (json.error) {
      return '⚠️ APIエラー: ' + json.error.message;
    }
    return '⚠️ 予期しない応答形式です。APIキーを確認してください。';
  } catch (e) {
    return '⚠️ 通信エラー: ' + e.message;
  }
}

// ── AIヒアリング（ゴール特定 + 抽象度引き上げ + ストーリー・ミッション抽出） ──

function startGoalHearing(taskInput) {
  var systemPrompt = 'あなたは優秀なプロジェクトマネージャーAIです。ユーザーがやるべきタスクを入力しました。\n' +
    'あなたの仕事は、ユーザーの「真のゴール」を段階的に特定することです。\n\n' +

    '■ 重要な考え方\n' +
    'ユーザーは多くの場合、中間タスクを最終ゴールと勘違いしています。\n' +
    '抽象度を段階的に引き上げてください：\n' +
    '例1（ビジネス）：\n' +
    '  Lv1 事業計画書を作成する（入力されたタスク）\n' +
    '  Lv2 銀行から融資を取り付ける（直接の目的）\n' +
    '  Lv3 新サービスをローンチして収益を得る（上位目的）\n' +
    '  Lv4 サービスを届けたお客様が幸せになる（究極目的＝ミッション）\n\n' +
    '例2（プライベート）：\n' +
    '  Lv1 旅行の計画を立てる（入力されたタスク）\n' +
    '  Lv2 結婚記念日を素敵にお祝いする（直接の目的）\n' +
    '  Lv3 パートナーとの絆を深める（上位目的）\n' +
    '  Lv4 家族みんなが幸せを感じる（究極目的＝ミッション）\n\n' +

    '■ ビジネスタスクの場合の深掘りアプローチ\n' +
    '事業計画・新サービス・起業系のタスクの場合は、以下も自然に引き出す：\n' +
    '1. 原体験・ストーリー：「なぜこの事業をやりたいのですか？きっかけや原体験があれば教えてください」\n' +
    '   → これにより、表面的な目標の奥にある本当の動機（＝ミッション）を引き出せる\n' +
    '2. 事業タイプの見極め：質問の流れの中で、以下のどちらかを自然に判断する\n' +
    '   - 受託型：顧客ごとにカスタマイズして対応する事業（例：コンサル、制作、代行）\n' +
    '     → 実績・信頼が最重要。顧客との関係性が鍵\n' +
    '   - プロダクト型：自社の商品・サービスを市場に展開する事業（例：製品販売、SaaS、スクール）\n' +
    '     → 独自の価値提案（USP）が最重要。競合との差別化が鍵\n' +
    '3. ニッチ戦略の確認：「大手がやらない領域」を狙っているかを確認する\n' +
    '   ※ これらは自然な会話の中で引き出すこと。フレームワーク名や用語は使わない。\n\n' +

    '■ ビジネスタスク全般での強みの引き出し（全ビジネスタスクに適用）\n' +
    '会話の自然な流れの中で、ユーザーの事業・プロジェクトが以下の5つの軸のうち\n' +
    '「どこで圧倒的に勝つか（支配軸）」「どこで差をつけるか（差別化軸）」を見極める：\n' +
    '  ① 価格（コスパ、料金体系の魅力）\n' +
    '  ② 商品力（品質、独自性、機能）\n' +
    '  ③ アクセス（手軽さ、入手しやすさ、立地、オンライン対応）\n' +
    '  ④ サービス（対応品質、サポート、アフターフォロー）\n' +
    '  ⑤ 経験価値（体験そのものの素晴らしさ、感動、ブランド体験）\n' +
    '重要：全部で勝とうとするのはNG。5つのうち1つを圧倒的に（支配）、もう1つで明確に差をつけ（差別化）、\n' +
    '残り3つは業界水準を満たしていれば十分。\n' +
    '質問例（自然な言い方で）：\n' +
    '  「お客様があなたを選ぶ一番の決め手って何だと思いますか？」\n' +
    '  「競合と比べて、ここだけは絶対負けないという部分はどこですか？」\n' +
    '  「価格で勝負するタイプですか？それとも品質や体験で選ばれるタイプですか？」\n' +
    '※ フレームワーク名（5ウェイ、ポジショニング等）は絶対に使わない。\n' +
    '※ 5軸すべてを聞く必要はない。会話の中で支配軸と差別化軸が自然に特定できればOK。\n\n' +

    '■ 会話のルール\n' +
    '1. まず背景・目的を1つだけ質問する\n' +
    '   ビジネス系タスクの場合は「なぜこれをやろうと思ったのか」から始めると良い\n' +
    '2. 回答を元に、さらに「その先にある目的」を引き出す\n' +
    '3. 抽象度レベルが見えてきたら、全レベルを提示する\n' +
    '4. 提示形式：\n' +
    '   🎯 Lv1: ○○（入力タスク）\n' +
    '   🎯 Lv2: ○○（直接の目的）\n' +
    '   🎯 Lv3: ○○（上位目的）\n' +
    '   🎯 Lv4: ○○（究極目的・あなたのミッション）\n' +
    '   「今回のゴールはどのレベルに設定しますか？」と聞く\n' +
    '5. ユーザーがレベルを選んだら：\n' +
    '   「【ゴール確定】」と書いてから選ばれたゴールを1行で書く。\n' +
    '   その次の行に「【選択レベル】Lv○」と書く。\n' +
    '   ビジネスの場合はその次の行に「【事業タイプ】受託型」or「【事業タイプ】プロダクト型」と書く\n' +
    '   （プライベートの場合は事業タイプ行は不要）\n' +
    '   ビジネスの場合、さらに次の行に「【支配軸】○○」「【差別化軸】○○」と書く\n' +
    '   ○○は：価格/商品力/アクセス/サービス/経験価値 のいずれか\n' +
    '   （会話から特定できなかった場合は省略してOK）\n' +
    '6. 質問は一度に1つだけ。簡潔に。フレンドリーに。\n' +
    '7. 最大5回の質問で確定させる（ストーリー・強み引き出しの分、1回多い）\n' +
    '8. ビジネスかプライベートかで口調やアプローチを変える\n' +
    '9. ユーザーの言葉をそのまま活かし、専門用語やフレームワーク名は使わない';
  
  var messages = [{ role: 'user', content: 'やるべきタスク：「' + taskInput + '」' }];
  var reply = callGemini(messages, systemPrompt);
  return reply;
}

function continueHearing(chatHistory, taskInput) {
  var systemPrompt = 'あなたは優秀なプロジェクトマネージャーAIです。ユーザーのタスクの「真のゴール」を段階的に特定中です。\n' +
    '元のタスク：「' + taskInput + '」\n\n' +
    '■ ルール\n' +
    '1. 抽象度を段階的に引き上げる（Lv1→Lv4）\n' +
    '2. ビジネス系タスクの場合、自然な会話の中で以下も把握する：\n' +
    '   - 原体験やストーリー（なぜこの事業をやりたいのか）\n' +
    '   - 事業タイプ（顧客に合わせる受託型 or 自社パッケージのプロダクト型）\n' +
    '   - 大手が手を出さないニッチな領域を狙えているか\n' +
    '   - 強みの軸：5つの勝負所（価格/商品力/アクセス/サービス/経験価値）のうち\n' +
    '     どこで圧倒的に勝つか（支配軸）、どこで差をつけるか（差別化軸）を見極める\n' +
    '   ※ フレームワーク名は使わず、自然な質問で引き出す\n' +
    '3. 全レベルが見えたら提示して選択してもらう：\n' +
    '   🎯 Lv1: ○○（入力タスク）\n' +
    '   🎯 Lv2: ○○（直接の目的）\n' +
    '   🎯 Lv3: ○○（上位目的）\n' +
    '   🎯 Lv4: ○○（究極目的・あなたのミッション）\n' +
    '4. ユーザーがレベルを選んだら「【ゴール確定】」と書いてゴールを1行で書く\n' +
    '   次の行に「【選択レベル】Lv○」と書く\n' +
    '   ビジネスの場合はその次に「【事業タイプ】受託型」or「【事業タイプ】プロダクト型」と書く\n' +
    '   さらにビジネスの場合「【支配軸】○○」「【差別化軸】○○」と書く（特定できた場合のみ）\n' +
    '   ○○は：価格/商品力/アクセス/サービス/経験価値 のいずれか\n' +
    '5. 質問は一度に1つ。簡潔に。フレームワーク名や専門用語は使わない。';
  
  var messages = [];
  for (var i = 0; i < chatHistory.length; i++) {
    messages.push({
      role: chatHistory[i].role,
      content: chatHistory[i].content
    });
  }
  
  return callGemini(messages, systemPrompt);
}

// ── スケジュール生成 ──

function generateScheduleData(taskInput, trueGoal, goalLevel, goalDateStr, goalTime, isPrivate, bizType, dominateAxis, differAxis, selectedPhases) {
  // ビジネスの事業計画系かどうかを判定
  var isBizPlan = !isPrivate && /事業計画|新サービス|起業|新規事業|ローンチ|リリース|立ち上げ|ブランド|PR|マーケ|集客/.test(taskInput + trueGoal);
  
  // selectedPhasesが空の場合はデフォルト（従来互換）
  if (!selectedPhases || selectedPhases.length === 0) {
    selectedPhases = ['origin', 'concept', 'positioning', 'validate'];
  }
  
  // ポジショニング情報をプロンプトに組み込む
  var positioningNote = '';
  if (!isPrivate && (dominateAxis || differAxis) && selectedPhases.indexOf('positioning') >= 0) {
    positioningNote = '\n\n■ この事業・プロジェクトの勝負所\n';
    if (dominateAxis) {
      positioningNote += '圧倒的に勝つべき軸：「' + dominateAxis + '」\n' +
        '  → この軸に関連するタスクは特に具体的・重点的に設計すること\n';
    }
    if (differAxis) {
      positioningNote += '差をつけるべき軸：「' + differAxis + '」\n' +
        '  → この軸を磨くためのタスクも必ず含めること\n';
    }
    positioningNote += 'それ以外の軸（価格/商品力/アクセス/サービス/経験価値の残り）は業界水準を満たすレベルでOK。\n' +
      '※ 軸の名前（「支配軸」「差別化軸」等）はタスク名や説明には絶対に書かない。自然な作業名にすること。\n';
  }
  
  // フェーズ構造をselectedPhasesに基づいて動的に構築
  var bizPlanPhases = '';
  if (isBizPlan) {
    bizPlanPhases = '\n\n■ ユーザーが選択したフェーズのみでマイルストーンを組むこと\n';
    var phaseNum = 1;
    
    // Phase: 原点整理
    if (selectedPhases.indexOf('origin') >= 0) {
      bizPlanPhases += '\nPhase ' + phaseNum + ': 原点整理（1-2マイルストーン）\n' +
        '  - 自分の原体験・強みの棚卸し\n' +
        '  - ミッション（なぜやるのか）・ビジョン（どんな未来を作るのか）の言語化\n' +
        '  ※ ここが曖昧だと後のフェーズが全てブレる。最重要フェーズ。\n';
      phaseNum++;
    }
    
    // Phase: コンセプト設計
    if (selectedPhases.indexOf('concept') >= 0) {
      bizPlanPhases += '\nPhase ' + phaseNum + ': コンセプト設計（2-3マイルストーン）\n';
      if (bizType === '受託型') {
        bizPlanPhases +=
          '  【受託型の事業】顧客ごとにカスタマイズして対応する事業\n' +
          '  - 実績と信頼関係の構築が最重要\n' +
          '  - 訴求ポイントを整理：①サービス概要 ②選ばれる理由 ③顧客の声 ④実績 ⑤ストーリー ⑥利用ステップ\n' +
          '  - 実績がない場合はモニター獲得を最優先タスクに\n';
      } else if (bizType === 'プロダクト型') {
        bizPlanPhases +=
          '  【プロダクト型の事業】自社の商品・サービスを市場に展開する事業\n' +
          '  - 独自の価値提案（USP）が最重要\n' +
          '  - 大手がカバーしないニッチ領域を狙う戦略\n' +
          '  - 価値提案の策定：誰に・何を・なぜ自分が・競合との違い\n' +
          '  - 訴求ポイントを整理：①サービス概要 ②選ばれる理由（USP） ③顧客の未来像 ④実績 ⑤ストーリー ⑥利用ステップ\n';
      } else {
        bizPlanPhases +=
          '  - ターゲット顧客と提供価値の明確化\n' +
          '  - 大手がやらないニッチな領域を狙う\n' +
          '  - 自分たちにしかできない唯一無二の強みを見つける\n' +
          '  - PR設計：①サービス概要 ②選ばれる理由 ③顧客の声 ④実績 ⑤ストーリー ⑥利用ステップ\n';
      }
      phaseNum++;
    }
    
    // Phase: 強みのポジショニング
    if (selectedPhases.indexOf('positioning') >= 0) {
      bizPlanPhases += '\nPhase ' + phaseNum + ': 強みのポジショニング（1-2マイルストーン）\n' +
        '  - 5つの勝負軸（価格/商品力/アクセス/サービス/経験価値）を分析\n' +
        '  - 圧倒的に勝つ軸を1つ、差をつける軸を1つ特定\n' +
        '  - 残り3軸は業界水準を満たす方針を決定\n' +
        '  - 競合との比較マップを作成\n' +
        '  ※ フレームワーク名はタスクに書かない。「自社の強み分析」「競合調査」等の自然な名前で。\n';
      phaseNum++;
    }
    
    // Phase: ブランド設計（新規追加）
    if (selectedPhases.indexOf('brand') >= 0) {
      bizPlanPhases += '\nPhase ' + phaseNum + ': ブランド設計（2-3マイルストーン）\n' +
        '  以下の6つのステップを踏んでブランドの核を作る：\n' +
        '  ① 感じて欲しい感情を決める（情緒的価値）：お客様がブランドに触れた瞬間の第一印象\n' +
        '  ② 感じて欲しい変化を決める（機能的価値）：A→Bへの変化。「こうなれそう！」と期待させる\n' +
        '  ③ どう見られたいかを決める（自己表現的価値）：これを使っている自分が周りからどう見られるか\n' +
        '     ※ 自己表現的価値を持つブランドは強く、数少ない。ここが頂点。\n' +
        '  ④ ブランド表現ガイドを作る：やるべき訴求とNGな表現を各3つ整理\n' +
        '  ⑤ 世界観キーワードを策定：ミッションから導出したメインKW3つ＋サブKW5つ\n' +
        '  ⑥ ビジュアル方針を決める：世界観KWに合う参考ブランド・人物を3つ選び、HP/ロゴ/写真の方向性を決定\n' +
        '  タスクには「ブランド価値ピラミッド」等の用語は使わない。自然な作業名にする。\n' +
        '  AIプロンプトで「お客様にどんな気持ちになってほしいか」「利用者がどう変わるか」等を引き出す。\n';
      phaseNum++;
    }
    
    // Phase: 検証・実行
    if (selectedPhases.indexOf('validate') >= 0) {
      bizPlanPhases += '\nPhase ' + phaseNum + ': 検証・実行（2-3マイルストーン）\n' +
        '  - まずモニター（テスト顧客）で小さく試す。完璧を目指さず、まず動く\n' +
        '  - 顧客フィードバック収集 → 改善 → 再検証のループ\n' +
        '  - 判断基準：①結果が出たか ②顧客に喜ばれたか ③もっと良い方法はないか\n' +
        '  - サービスは「手段」であり、いつでもピボット可能。ミッションだけはブレない\n' +
        '  ※ 新しい事業は成功率5%。一発で決まらないのが普通。「一勝九敗」の精神で。\n';
      phaseNum++;
    }
    
    // Phase: 認知拡大・SNS戦略（新規追加）
    if (selectedPhases.indexOf('awareness') >= 0) {
      bizPlanPhases += '\nPhase ' + phaseNum + ': 認知拡大・SNS戦略（2-3マイルストーン）\n' +
        '  - 認知→体験→購買の各段階で「共感・拡散」が起きる設計を意識\n' +
        '  - 活用できるチャネル：SNS、メディア露出、出版、無料セミナー、イベント、広告、メルマガ、LINE\n' +
        '  - 顧客のフェーズに合ったチャネルを選定（全部やる必要はない）\n' +
        '  - SNS発信の投稿設計：\n' +
        '    ・実績投稿（お客様の声・成果事例）… 全体の約1/6\n' +
        '    ・お役立ち情報（ノウハウ・知識）… 全体の約2/6 → リスト誘導に効く\n' +
        '    ・多面性・近況（日常・価値観・舞台裏）… 全体の約3/6 → 共感と一体感を創出\n' +
        '  - ブランドリレーション：サービス完成後も「常にブランドとの関係を維持・強化」する継続施策\n' +
        '  ※ フレームワーク名はタスクに書かない。「SNS投稿計画の作成」「認知チャネルの選定」等の自然な名前で。\n';
      phaseNum++;
    }
  }
  
  // マーケティング・PR系タスクの場合のフレームワーク
  var marketingNote = '';
  if (!isPrivate && /PR|マーケ|認知|集客|広報|SNS|ブランド|プロモ/.test(taskInput + trueGoal)) {
    marketingNote = '\n\n■ マーケティング・PR系タスクの場合\n' +
      '最新の消費者行動モデル「RsEsPs」を意識したマイルストーン設計を行う：\n' +
      '  Recognition（認知）× Spread（共感・拡散）\n' +
      '  Experience（体験）× Spread（共感・拡散）\n' +
      '  Purchase（購買）× Spread（共感・拡散）\n' +
      '各フェーズで「いかに共感・シェアを生むか」を組み込む。\n' +
      '従来のAISAS（認知→興味→検索→行動→共有）は「共有が最後」だが、\n' +
      'RsEsPsでは「全段階で共感・拡散が発生する」点が異なる。\n' +
      '※ フレームワーク名はマイルストーンには書かない。自然な日本語タスク名にする。\n';
  }

  var systemPrompt = 'あなたはプロジェクトマネージャーAIです。\n' +
    'ゴールから逆算してタスクスケジュールをJSON形式で生成してください。\n\n' +
    '■ 基本ルール\n' +
    '1. 最終ゴール日から営業日ベースで逆算する' + (isPrivate ? '（プライベートの場合は土日も含めてOK）' : '') + '\n' +
    '2. 各マイルストーンには以下を含める：\n' +
    '   - title: タスク名（自然な日本語。フレームワーク名や英語略称は使わない）\n' +
    '   - daysBefore: ゴールの何' + (isPrivate ? '日' : '営業日') + '前か(0=当日)\n' +
    '   - description: やるべきことの説明（具体的に）\n' +
    '   - aiPrompt: このタスクでAIに投げると良いプロンプト（日本語・具体的に）\n' +
    '     AIプロンプトは「このタスクを完遂するために私に質問してください」系の\n' +
    '     対話型プロンプトを基本とする。ユーザーが思考を構造化できるように。\n' +
    '   - category: "draft"|"review"|"meeting"|"research"|"booking"|"final"|"goal"のいずれか\n' +
    '3. ' + (isBizPlan && selectedPhases.length > 3 ? '8-14' : '6-10') + '個のマイルストーンを生成\n' +
    '4. 抽象度レベル' + goalLevel + 'のゴールに適した粒度で\n' +
    '5. ' + (isPrivate ? 'プライベート向け：予約、買い物、準備なども含める' : 'ビジネス向け：社内共有・レビューを必ず含める') + '\n' +
    '6. JSON配列のみ返すこと。マークダウンのコードブロック不要。\n' +
    '7. タスク名や説明にフレームワーク名（AISAS、RsEsPs、MVV、5ウェイ、ブランド価値ピラミッド等）は絶対に書かない。自然な作業名にすること。' +
    bizPlanPhases +
    marketingNote +
    positioningNote;
  
  var messages = [{
    role: 'user',
    content: '元のタスク：' + taskInput + '\n' +
      '真のゴール（Lv' + goalLevel + '）：' + trueGoal + '\n' +
      'ゴール日：' + goalDateStr + '\n' +
      'カテゴリ：' + (isPrivate ? 'プライベート' : 'ビジネス') +
      (bizType ? '\n事業タイプ：' + bizType : '') +
      (dominateAxis ? '\n圧倒的に勝つ軸：' + dominateAxis : '') +
      (differAxis ? '\n差をつける軸：' + differAxis : '') +
      (selectedPhases && selectedPhases.length > 0 ? '\n選択フェーズ：' + selectedPhases.join(', ') : '') + '\n\n' +
      '逆算スケジュールをJSON配列で生成してください。'
  }];
  
  var reply = callGemini(messages, systemPrompt);
  
  try {
    var cleaned = reply.replace(/```json?|```/g, '').trim();
    var parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    // フォールバック：デフォルトスケジュール
    if (isPrivate) {
      return [
        { title: 'リサーチ＆情報収集', daysBefore: 14, description: '候補のリストアップ・口コミ調査', aiPrompt: '「' + taskInput + '」のために、最適な選択肢を見つけたいです。私の状況や好みについて質問してください。', category: 'research' },
        { title: '予約・手配', daysBefore: 10, description: '必要な予約を完了する', aiPrompt: '以下の条件で最適なプランを提案してください：\n（ここに条件を記入）', category: 'booking' },
        { title: '準備リスト作成', daysBefore: 7, description: '当日までに準備するものをリストアップ', aiPrompt: '「' + trueGoal + '」を成功させるために必要な準備リストを作成してください。', category: 'draft' },
        { title: '最終確認', daysBefore: 2, description: '予約内容・準備物の最終チェック', aiPrompt: '以下の予定の最終チェックリストを作ってください：\n（ここに予定内容を記入）', category: 'final' },
        { title: trueGoal, daysBefore: 0, description: '当日！楽しんで！', aiPrompt: '', category: 'goal' }
      ];
    }
    // ビジネスのフォールバック（事業計画系かどうかで分岐）
    if (isBizPlan) {
      return [
        { title: '原体験・強みの棚卸し', daysBefore: 18, description: 'なぜこの事業をやりたいのか、自分の経験から紐解く。過去の転機や成功体験を5〜10個書き出す', aiPrompt: '新しい事業を始めようとしています。私の強みや原体験を引き出すために、これまでの経歴や転機について質問してください。なぜこの事業をやりたいのか、本当の理由を一緒に見つけたいです。', category: 'research' },
        { title: 'ミッション・ビジョンの言語化', daysBefore: 15, description: '「なぜやるのか（使命）」と「実現したい未来の姿」を一文ずつ言語化する', aiPrompt: '以下の原体験をもとに、私の事業の「使命（なぜやるのか）」と「目指す未来像」を言語化したいです。質問しながら一緒に整理してください：\n（ここに原体験を記入）', category: 'draft' },
        { title: 'ターゲット顧客と提供価値の設計', daysBefore: 12, description: '誰に・何を・なぜ自分が提供するのかを明確にする。大手がやらない領域を狙う', aiPrompt: '以下のミッション・ビジョンのもとで、最適なターゲット顧客と提供価値を設計したいです。大手が参入しにくいニッチな切り口を一緒に見つけてください：\n（ここにミッション・ビジョンを記入）', category: 'draft' },
        { title: '事業コンセプトのたたき台作成', daysBefore: 10, description: 'サービス概要・選ばれる理由・想定する顧客の声・ストーリーを一枚にまとめる', aiPrompt: '以下の情報で事業コンセプトシートを作成したいです。抜け漏れがないか質問してください：\n（ここにターゲット・提供価値を記入）', category: 'draft' },
        { title: '社内・メンター共有とフィードバック', daysBefore: 7, description: 'たたき台を信頼できる関係者に共有し、率直なフィードバックをもらう', aiPrompt: '以下の事業コンセプトについて、関係者に共有するためのメール文面を作成してください：\n（ここにコンセプトの要約を記入）', category: 'meeting' },
        { title: 'コンセプト修正・モニター計画', daysBefore: 5, description: 'フィードバックを反映し、最初のテスト顧客（モニター）の獲得計画を立てる', aiPrompt: '以下のフィードバックを元に事業コンセプトを改善してください。また、最初の3〜5名のテスト顧客を獲得するための具体的なアクションプランを提案してください：\n（ここにFBを貼り付け）', category: 'review' },
        { title: '事業計画書の仕上げ', daysBefore: 3, description: '修正済みコンセプトを元に事業計画書を完成させる', aiPrompt: '以下の事業コンセプトと検証計画を元に、事業計画書の各セクションを作成してください：\n（ここに最新のコンセプトを記入）', category: 'final' },
        { title: trueGoal, daysBefore: 0, description: '本番当日。完璧でなくてOK。まず動き、フィードバックを得て改善する', aiPrompt: '', category: 'goal' }
      ];
    }
    return [
      { title: taskInput + '：たたき台作成', daysBefore: 10, description: 'AIを活用してたたき台を作成', aiPrompt: '「' + taskInput + '」を作成するために、私に必要な質問をしてください。目的・対象者・構成など、抜け漏れなく聞いてください。', category: 'draft' },
      { title: '社内関係者への初回共有', daysBefore: 7, description: 'たたき台を関係者に共有しフィードバックを依頼', aiPrompt: '以下のたたき台について、関係者に共有するためのメール文面を作成してください：\n（ここにたたき台の要約を記入）', category: 'meeting' },
      { title: taskInput + '：ブラッシュアップ', daysBefore: 6, description: 'フィードバックを元に修正', aiPrompt: '以下のフィードバックを元に改善してください。改善ポイントごとに理由と修正案を提示してください：\n（ここにFBを貼り付け）', category: 'review' },
      { title: '社内関係者への最終共有', daysBefore: 4, description: '修正版を関係者に最終確認', aiPrompt: '', category: 'meeting' },
      { title: taskInput + '：最終調整', daysBefore: 3, description: '最終フィードバック反映・仕上げ', aiPrompt: '以下の最終フィードバックを反映して完成版を作成してください：\n（ここにFBを貼り付け）', category: 'final' },
      { title: trueGoal, daysBefore: 0, description: '本番当日', aiPrompt: '', category: 'goal' }
    ];
  }
}

// ── スプレッドシートに書き出し ──

function writeScheduleToSheet(taskInput, trueGoal, goalLevel, goalDateStr, goalTime, scheduleData, isPrivate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = '逆算スケジュール';
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }
  
  var goalDate = new Date(goalDateStr);
  
  // ── ヘッダー情報 ──
  sheet.getRange('A1').setValue('🧭 逆算AI スケジュール').setFontSize(16).setFontWeight('bold').setFontColor('#D97706');
  sheet.getRange('A2').setValue('作成日: ' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'));
  sheet.getRange('A3').setValue('元のタスク: ' + taskInput);
  sheet.getRange('A4').setValue('真のゴール（Lv' + goalLevel + '）: ' + trueGoal);
  sheet.getRange('A5').setValue('ゴール日: ' + formatDateJP(goalDate) + ' ' + goalTime);
  sheet.getRange('A6').setValue(isPrivate ? '種別: プライベート' : '種別: ビジネス');
  
  // ── テーブルヘッダー ──
  var headerRow = 8;
  var headers = ['#', '日付', '曜日', '残り日数', 'カテゴリ', 'タスク', '説明', 'AIプロンプト', '完了'];
  sheet.getRange(headerRow, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(headerRow, 1, 1, headers.length)
    .setBackground('#D97706')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // ── データ行 ──
  var catEmoji = {
    'draft': '✏️ 作成',
    'review': '🔄 レビュー',
    'meeting': '👥 共有',
    'research': '🔍 調査',
    'booking': '📞 予約',
    'final': '✨ 最終調整',
    'goal': '🎯 ゴール'
  };
  
  var catColors = {
    'draft': '#DBEAFE',
    'review': '#EDE9FE',
    'meeting': '#D1FAE5',
    'research': '#FEF3C7',
    'booking': '#FCE7F3',
    'final': '#FEF3C7',
    'goal': '#FEE2E2'
  };
  
  // ソート
  scheduleData.sort(function(a, b) { return b.daysBefore - a.daysBefore; });
  
  var calendarEvents = [];
  
  for (var i = 0; i < scheduleData.length; i++) {
    var item = scheduleData[i];
    var itemDate;
    if (item.daysBefore === 0) {
      itemDate = new Date(goalDate);
    } else if (isPrivate) {
      itemDate = new Date(goalDate);
      itemDate.setDate(itemDate.getDate() - item.daysBefore);
    } else {
      itemDate = subtractBusinessDays(goalDate, item.daysBefore);
    }
    
    var row = headerRow + 1 + i;
    var days = ['日', '月', '火', '水', '木', '金', '土'];
    var dayStr = item.daysBefore === 0 ? '当日' : item.daysBefore + (isPrivate ? '日前' : '営業日前');
    var cat = catEmoji[item.category] || item.category;
    var bgColor = catColors[item.category] || '#FFFFFF';
    
    var rowData = [
      i + 1,
      Utilities.formatDate(itemDate, 'Asia/Tokyo', 'yyyy/MM/dd'),
      days[itemDate.getDay()],
      dayStr,
      cat,
      item.title,
      item.description,
      item.aiPrompt || '',
      '☐'
    ];
    
    sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
    sheet.getRange(row, 1, 1, rowData.length).setBackground(bgColor);
    
    // ゴール行を強調
    if (item.daysBefore === 0) {
      sheet.getRange(row, 1, 1, rowData.length).setFontWeight('bold').setFontColor('#DC2626');
    }
    
    // カレンダーイベント用データ
    calendarEvents.push({
      title: '【逆算AI】' + item.title,
      date: itemDate,
      time: item.daysBefore === 0 ? goalTime : '09:00',
      description: item.description + (item.aiPrompt ? '\n\n💡 AIプロンプト:\n' + item.aiPrompt : ''),
      category: item.category
    });
  }
  
  // ── 書式設定 ──
  var lastRow = headerRow + scheduleData.length;
  sheet.setColumnWidth(1, 40);   // #
  sheet.setColumnWidth(2, 100);  // 日付
  sheet.setColumnWidth(3, 50);   // 曜日
  sheet.setColumnWidth(4, 90);   // 残り日数
  sheet.setColumnWidth(5, 100);  // カテゴリ
  sheet.setColumnWidth(6, 200);  // タスク
  sheet.setColumnWidth(7, 250);  // 説明
  sheet.setColumnWidth(8, 350);  // AIプロンプト
  sheet.setColumnWidth(9, 50);   // 完了
  
  // 罫線
  sheet.getRange(headerRow, 1, scheduleData.length + 1, headers.length)
    .setBorder(true, true, true, true, true, true, '#D1D5DB', SpreadsheetApp.BorderStyle.SOLID);
  
  // テキスト折り返し
  sheet.getRange(headerRow + 1, 7, scheduleData.length, 2).setWrap(true);
  
  // カレンダーイベントデータを非表示シートに保存
  var dataSheet = ss.getSheetByName('_calendar_data');
  if (!dataSheet) {
    dataSheet = ss.insertSheet('_calendar_data');
    dataSheet.hideSheet();
  } else {
    dataSheet.clear();
  }
  dataSheet.getRange(1, 1).setValue(JSON.stringify(calendarEvents));
  
  // スケジュールシートをアクティブに
  ss.setActiveSheet(sheet);
  
  return {
    success: true,
    message: '✅ スケジュールを「' + sheetName + '」シートに書き出しました！\n\n' +
      '📋 ' + scheduleData.length + '個のマイルストーン\n' +
      '📅 ' + formatDateJP(scheduleData[scheduleData.length - 1].daysBefore === 0 ? goalDate : subtractBusinessDays(goalDate, scheduleData[0].daysBefore)) + 
      ' 〜 ' + formatDateJP(goalDate) + '\n\n' +
      'メニュー「逆算AI」→「Googleカレンダーに書き出し」で\nカレンダーにも登録できます。',
    eventCount: scheduleData.length
  };
}

// ── Googleカレンダー書き出し ──

function exportToCalendar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheetByName('_calendar_data');
  
  if (!dataSheet) {
    SpreadsheetApp.getUi().alert('⚠️ まだスケジュールが生成されていません。\n先に逆算AIでスケジュールを作成してください。');
    return;
  }
  
  var jsonStr = dataSheet.getRange(1, 1).getValue();
  if (!jsonStr) {
    SpreadsheetApp.getUi().alert('⚠️ スケジュールデータが見つかりません。');
    return;
  }
  
  var events = JSON.parse(jsonStr);
  var calendar = CalendarApp.getDefaultCalendar();
  var count = 0;
  
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var startDate = new Date(ev.date);
    if (ev.time) {
      var timeParts = ev.time.split(':');
      startDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);
    } else {
      startDate.setHours(9, 0, 0);
    }
    
    var endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);
    
    calendar.createEvent(ev.title, startDate, endDate, {
      description: ev.description || ''
    });
    count++;
  }
  
  SpreadsheetApp.getUi().alert('✅ Googleカレンダーに ' + count + ' 件のイベントを登録しました！');
}

// ── サイドバーから呼ばれるブリッジ関数 ──

function processSchedule(params) {
  var scheduleData = generateScheduleData(
    params.taskInput,
    params.trueGoal,
    params.goalLevel,
    params.goalDate,
    params.goalTime,
    params.isPrivate,
    params.bizType || '',
    params.dominateAxis || '',
    params.differAxis || '',
    params.selectedPhases || []
  );
  
  return writeScheduleToSheet(
    params.taskInput,
    params.trueGoal,
    params.goalLevel,
    params.goalDate,
    params.goalTime,
    scheduleData,
    params.isPrivate
  );
}

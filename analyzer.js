const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// [수정 사항] Render 클라우드가 동적으로 부여하는 외부 환경 포트(process.env.PORT)를 최우선으로 잡습니다.
// 로컬 컴퓨터에서 켤 때는 기존처럼 3000번 포트로 작동합니다.
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. MongoDB Atlas 연결 주소 (발급받으신 클라우드 DB 주소 고정)
const dbURI = 'mongodb+srv://dkdlah1004love_db_user:yNoq3KmBzlxOF3jx@cluster0.8v7z6do.mongodb.net/baccarat_logs?retryWrites=true&w=majority';

// 2. 바카라 패턴 데이터 구조화 (Schema)
const BaccaratLogSchema = new mongoose.Schema({
  roundId: { type: String, default: () => `ROUND-${new Date().toISOString().slice(0,10)}-${Date.now().toString().slice(-4)}` }, 
  result: { type: String, required: true },        
  pattern1군: { type: String }, 
  pattern2군: { type: String }, 
  pattern3군: { type: String }, 
  pattern4군: { type: String }, 
  createdAt: { type: Date, default: Date.now }
});

const BaccaratLog = mongoose.model('BaccaratLog', BaccaratLogSchema);

mongoose.connect(dbURI)
  .then(() => console.log('🚀 MongoDB 데이터베이스 연결 성공!'))
  .catch((err) => console.error('❌ 데이터베이스 연결 실패:', err.message));

// Render 서버 가동 유지를 위한 헬스체크 주소 기본 추가
app.get('/', (req, res) => {
  res.status(200).send('🎮 바카라 예측 엔진 백엔드 서버가 클라우드에서 정상 동작 중입니다.');
});

// 3. [데이터 실시간 적재 + 역사적 패턴 확률 연산] API 엔드포인트
app.post('/api/analyze-and-save', async (req, res) => {
  try {
    const { result, pattern1군, pattern2군, pattern3군, pattern4군 } = req.body;
    console.log('📥 실시간 클라우드 데이터 수신:', req.body);

    // [A] MongoDB에 실시간 데이터 즉시 자동 저장
    const newLog = new BaccaratLog({ result, pattern1군, pattern2군, pattern3군, pattern4군 });
    const savedLog = await newLog.save();
    console.log('✅ MongoDB 적재 성공:', savedLog.roundId);

    // [B] 데이터 기반 확률 계산 알고리즘 수행
    const historicalMatches = await BaccaratLog.find({ pattern1군, pattern2군, pattern3군, pattern4군 });
    
    let playerWins = 0;
    let bankerWins = 0;

    historicalMatches.forEach(log => {
      if (log.result === 'PLAYER') playerWins++;
      if (log.result === 'BANKER') bankerWins++;
    });

    let prediction = "데이터 부족 (대기)";
    let confidence = 50;

    if (historicalMatches.length > 0) {
      const total = playerWins + bankerWins;
      if (total > 0) {
        if (playerWins > bankerWins) {
          prediction = "PLAYER (파란색)";
          confidence = Math.round((playerWins / total) * 100);
        } else if (bankerWins > playerWins) {
          prediction = "BANKER (빨간색)";
          confidence = Math.round((bankerWins / total) * 100);
        } else {
          prediction = "TIE 또는 박빙";
          confidence = 50;
        }
      }
    } else {
      // 데이터가 없는 초기 상태일 때 가상 시뮬레이션 예측 배치
      prediction = Math.random() > 0.5 ? "PLAYER (파란색)" : "BANKER (빨간색)";
      confidence = Math.floor(Math.random() * 15) + 55; 
    }

    // [C] 프론트엔드로 연산 정보 응답 리턴
    res.status(200).json({
      success: true,
      message: '클라우드 적재 및 예측 연산 완료!',
      savedRound: savedLog.roundId,
      predictionResult: {
        nextPick: prediction, 
        probability: `${confidence}%`, 
        matchCount: historicalMatches.length 
      }
    });

  } catch (err) {
    console.error('❌ 클라우드 서버 처리 오류:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 포트 개방 및 대기
app.listen(PORT, () => {
  console.log(`📡 예측 엔진 서버가 포트 ${PORT} 에서 활성화되었습니다...`);
});

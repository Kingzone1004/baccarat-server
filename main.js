const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 화면 레이아웃에 최적화된 창 크기 설정
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    title: "바카라 7개 군 적재 & 역사적 패턴 예측기",
    autoHideMenuBar: true, // 상단 메뉴바 숨김 처리
    webPreferences: {
      nodeIntegration: true,     // 외부 클라우드 통신 허용
      contextIsolation: false,   // 내부 차단막 해제
      webSecurity: false         // 클라우드 주소 접근(CORS) 보안 우회
    }
  });

  // 현재 폴더의 index.html을 화면으로 로드
  win.loadFile(path.join(__dirname, 'index.html'));

  // [참고] 만약 창이 켜진 후 내부에서 어떤 에러가 나는지 개발자 도구로 보려면 아래 주석(//)을 푸시면 됩니다.
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

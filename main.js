// Koji Ota
// Aug 07, 2021

const electron = require('electron');
const path = require('path');
const url = require('url');

const app = electron.app;

let mainWindow = null;

//
electron.ipcMain.on("message", (event, data) => {
    console.log(data);
    event.returnValue = "from main";
    return;
});

//
function createMenu() {
    let template = [{
	label: "ファイル",
	submenu: [{
	    label: "開く",
	    accelerator: "CmdOrCtrl+O",
	    click: function(item, focusWindow) {
		let fw = electron.BrowserWindow.getFocusedWindow();
		fw.webContents.send('message', 'open-file');
	    }
	}, {
	    type: "separator"
	}, {
	    label: "保存",
	    accelerator: "CmdOrCtrl+S",
	    click: function(item, focusWindow) {
		let fw = electron.BrowserWindow.getFocusedWindow();
		fw.webContents.send('message', 'save-file');
	    }
	}, {
	    label: "名前を付けて保存",
	    accelerator: "Shift+CmdOrCtrl+S",
	    click: function(item, focusWindow) {
		let fw = electron.BrowserWindow.getFocusedWindow();
		fw.webContents.send('message', 'saveas-file');
	    }
	}, {
	    type: "separator"
	}, {
	    label: "終了",
	    accelerator: "CmdOrCtrl+Q",
	    role: 'quit'
	}]
    }, {
	label: "編集",
	submenu: [{
	    label: 'やり直し',
	    accelerator: 'CmdOrCtrl+Z',
	    role: 'undo'
	}, {
	    type: 'separator'
	}, {
	    label: '切り取り',
	    accelerator: 'CmdOrCtrl+X',
	    role: 'cut'
	}, {
	    label: 'コピー',
	    accelerator: 'CmdOrCtrl+C',
	    role: 'copy'
	}, {
	    label: '貼り付け',
	    accelerator: 'CmdOrCtrl+V',
	    role: 'paste'
	}]
    }, {
	label: "表示",
	submenu: [{
	    label: '拡大',
	    accelerator: 'CmdOrCtrl+Shift+=',
	    role: 'zoomin'
	}, {
	    label: '縮小',
	    accelerator: 'CmdOrCtrl+-',
	    role: 'zoomout'
	}, {
	    label: 'ズームのリセット',
	    accelerator: 'CmdOrCtrl+0',
	    role: 'resetzoom'
	}, {
	    type: 'separator'
	}, {
	    label: "ブラウザ",
	    click: function(item, focusWindow) {
			mainWindow.webContents.send("message", "open-browser");
	    }
	}, {
	    type: 'separator'
	}, {
	    label: "デバッガ",
	    click: function(item, focusWindow) {
		mainWindow.webContents.openDevTools();
	    }
	}]
    }];
    return template;
}

//
app.on('ready', () => {

    //
    const menu = electron.Menu.buildFromTemplate( createMenu() );
    electron.Menu.setApplicationMenu(menu);

    //
    mainWindow = new electron.BrowserWindow({
	width: 1024,
	height: 768,
	webPreferences: {
	    nodeIntegration: true,
	    contextIsolation: false,
	    enableRemoteModule: true
	}
    });

	// remove x-frame-options from web-sever.
	// https://github.com/electron/electron/issues/426
	mainWindow.webContents.session.webRequest.onHeadersReceived({ urls: [ "*://*/*" ] },
		(d, c)=>{
		if(d.responseHeaders['X-Frame-Options']){
			delete d.responseHeaders['X-Frame-Options'];
		} else if(d.responseHeaders['x-frame-options']) {
			delete d.responseHeaders['x-frame-options'];
		}
		c({cancel: false, responseHeaders: d.responseHeaders});
		}
	);

    // load front file.
    mainWindow.loadURL("file://" + __dirname + "/index.html");

    // show debugger
    //mainWindow.webContents.openDevTools();

    mainWindow.on("closed", function() {
		mainWindow = null;
    });
});

//
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

//
app.on('activate', () => {
    if (mainWindow === null) {
    }
});

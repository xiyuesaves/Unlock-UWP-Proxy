const regedit = require("regedit"); // 读取注册表
const child_process = require('child_process'); // 执行shell命令
const { app, BrowserWindow } = require('electron'); // 主键值
const { ipcMain, dialog } = require('electron'); // 进程通信用键值
const index_html = "./public/index.html"; // 页面路径

// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
var win;
//接收渲染进程发送过来的窗口id,以便主进程向渲染进程发送信息
var win_id = null;

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow)
//读取设置信息

//创建主窗口
function createWindow() {
    // 创建浏览器窗口。
    win = new BrowserWindow({
        width: 670,
        height: 540,
        minWidth: 300,
        minHeight: 470,
        // 无边框
        frame: false,
        fullscreenable: false,
        fullscreen: false,
        transparent: true,
        contextIsolation: false,
        webPreferences: {
            // 启用node支持
            nodeIntegration: true
        },
        //隐藏菜单栏
        autoHideMenuBar: true,
        // 顶栏样式
        titleBarStyle :"hidden"
    })
    // 加载主要页面文件
    win.loadFile(index_html)

    // 打开开发者工具
    // win.webContents.openDevTools()

    // win.on('move', (event) => {
    // 	console.log(win.x,win.y);
    // });

    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        win = null
    })
}

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// 关闭窗口
ipcMain.on('closeWindow', function(event) {
    win.close()
})

//接收渲染进程的选择文件夹请求
ipcMain.on('getAppIdArr', async function(event) {
    // let tempObj = await getId() // 弃用的获取SID接口
    let tempObj = await getPackageFamilyName()
    event.reply('getAppIdArr', tempObj)
})

// 获取已解锁应用列表
ipcMain.on('getUnlockLoopback', async function(event) {
    let tempObj = await getUnlockLoopback()
    event.reply('getUnlockLoopback', tempObj)
})

// 将选择应用加入解锁列表
ipcMain.on('setUnlockLoopback', async function(event, arg) {
    // console.log(arg);
    let tempObj = await setUnlockLoopback(arg)
    event.reply('changeOk')
})

//  将选择应用从解锁列表移除
ipcMain.on('deleteUnlockLoopback', async function(event, arg) {
    // console.log(arg);
    let tempObj = await deleteUnlockLoopback(arg)
    event.reply('changeOk')
})

// 获取uwp应用id,name [废弃了,有更快的查询方式]
async function getId() {
    let uwpIdArr = await getAppId()
    let uwpDetail = []
    if (uwpIdArr.length) {
        for (var i = 0; i < uwpIdArr.length; i++) {
            let tempJson = {
                appId: uwpIdArr[i],
                displayName: await getAppDetail(uwpIdArr[i])
            }
            uwpDetail.push(tempJson)
        }
        let tempJson = {
            status: true,
            data: uwpDetail,
            msg: ""
        }
        return tempJson
    } else {
        let tempJson = {
            status: true,
            data: [],
            msg: "没有查找到UWP应用"
        }
        return tempJson
    }

    function getAppId() {
        return new Promise((resolve, reject) => {
            regedit.list('HKCU\\SOFTWARE\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppContainer\\Mappings', function(err, result) {
                resolve(result['HKCU\\SOFTWARE\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppContainer\\Mappings'].keys)
            })
        })
    }

    function getAppDetail(appId) {
        return new Promise((resolve, reject) => {
            regedit.list('HKCU\\SOFTWARE\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppContainer\\Mappings\\' + appId, function(err, result) {
                resolve(result['HKCU\\SOFTWARE\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppContainer\\Mappings\\' + appId].values.DisplayName.value)
            })
        })
    }
}

// 获取uwp应用包名
async function getPackageFamilyName() {
	return new Promise((resolve, reject) => {
        child_process.exec('mode con cols=9999 lines=10 && powershell -Command "Get-AppxPackage"|findstr "Name"', (error, stdout, stderr) => {
            if (error) {
                resolve({
                    status: false,
                    data: "",
                    msg: error
                })
            }
            let tempArr = stdout.split("\r\n"),
            	tempArr2 = [],
            	tempArr3 = []
           	for (var i = 0; i < tempArr.length; i++) {
           		tempArr2.push(tempArr[i].replace(/ /g,"").split(":"))
           	}
           	for (var i = 0; i < tempArr2.length-3; i += 3) {
           		tempArr3.push({
           			name: tempArr2[i][1],
           			PackageFamilyName:  tempArr2[i+2][1]
           		})
           	}
            resolve({
                status: true,
                data: tempArr3,
                msg: ""
            })
        });
    })
}

// 获取环回免除的应用列表
async function getUnlockLoopback() {
	return new Promise((resolve, reject) => {
		child_process.exec('mode con cols=9999 lines=10 && powershell -Command "CheckNetIsolation.exe LoopbackExempt -s"|findstr "名称"', (error, stdout, stderr) => {
			// console.log(stdout);
			let tempArr = stdout.split("\r\n")
			// console.log(tempArr);
			for (var i = 0; i < tempArr.length-1; i++) {
				// console.log(tempArr[i].split(":"));
				tempArr[i] = tempArr[i].split(":")[1].replace(/\s/g,"")
			}
			tempArr.pop()
			// console.log(tempArr);
			resolve({
                status: true,
                data: tempArr,
                msg: ""
            })
		})
	})
}

// 向环回免除列表中添加
async function setUnlockLoopback(name) {
	return new Promise((resolve, reject) => {
		child_process.exec(`mode con cols=9999 lines=10 && powershell -Command "CheckNetIsolation.exe LoopbackExempt -a -n='${name}'"`, (error, stdout, stderr) => {
			resolve()
		})
	})
}

// 从环回免除列表中删除
async function deleteUnlockLoopback(name) {
	return new Promise((resolve, reject) => {
		child_process.exec(`mode con cols=9999 lines=10 && powershell -Command "CheckNetIsolation.exe LoopbackExempt -d -n='${name}'"`, (error, stdout, stderr) => {
			resolve()
		})
	})
}

// 清除环回免除
async function clearUnlockLoopback() {
	return new Promise((resolve, reject) => {
		
	})
}
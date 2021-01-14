const { ipcRenderer } = require('electron')
let dataArr = [],unlockLoopbackArr = []
let openTop = false;
let searchName = "";
let searchPackageName = "";
if (typeof module === 'object') {
    window.jQuery = window.$ = module.exports;
};

// 接收从App列表
ipcRenderer.on('getAppIdArr', (event, arg) => {
    console.log(arg)
    if (arg.status) {
    	if ($(".disable-search-tool")){
    		$(".disable-search-tool").removeClass("disable-search-tool")
    	}
        console.log("接收app列表", arg.data);
        dataArr = arg.data // 数据传给全局变量
        appendData(dataArr) // 渲染到页面
        // 请求环回免除的应用列表
        ipcRenderer.send('getUnlockLoopback')
    } else {
        console.log("出现错误", arg.msg);
    }
})

// 接收环回免除的应用列表
ipcRenderer.on('getUnlockLoopback', (event, arg) => {
	$("input[type='checkbox']").removeAttr('disabled'); // 解除禁用
    if (arg.status) {
    	unlockLoopbackArr = arg.data
        resetBtn(unlockLoopbackArr)
        if (openTop) {
			let tempNode = $("input[type='checkbox']:checked").parents(".data-list")
			$(".table .dataList").prepend(tempNode)
		}
    } else {
        console.log("出现错误", arg.msg);
    }
})

// 切换完成事件
ipcRenderer.on('changeOk', (event, arg) => {
	ipcRenderer.send('getUnlockLoopback')
})

// 检测开启状态
function resetBtn(data) {
	for (var i = 0; i < data.length; i++) {
    	// console.log($(`[data-package-name="${data[i]}" i]`));
    	$(`[data-package-name="${data[i]}" i]`).prop("checked",true)
    }
    $(`[data-package-name]:checked`).each(function(index, el) {
    	if (data.findIndex(item => $(el).attr('data-package-name').toLowerCase() === item.toLowerCase()) == -1) {
    		$(el).prop("checked",false)
    	}
    });
}

// 加载完成事件
window.onload = function() {
    console.log("on load");
    // 向主进程发送请求
    ipcRenderer.send('getAppIdArr')
}

// 将数据渲染到页面
function appendData(dataArr) {
	$(".dataList tr").remove()
    for (var i = 0; i < dataArr.length; i++) {
    	if (!$(`[data-package-name="${dataArr[i].PackageFamilyName}"]`).length) {
			let tempHtml = `<tr class="data-list">
							<td width="25%">
							    ${dataArr[i].name}
							</td>
							<td width="45%">
							    ${dataArr[i].PackageFamilyName}
							</td>
							<td width="10%">
							    <label class="toggle toggle-balanced">
							        <input onchange="changeStatus($(this).is(':checked'),$(this).attr('data-package-name'))" data-package-name="${dataArr[i].PackageFamilyName}" type="checkbox" >
							        <div class="track">
							            <div class="handle"></div>
							        </div>
							    </label>
							</td>
                       	</tr>`
        	$(".table .dataList").append(tempHtml)
    	}
    }
}

// 切换状态
function changeStatus(status,name) {
	if (status) {
		ipcRenderer.send('setUnlockLoopback',name)
		$("input[type='checkbox']").attr('disabled', 'disabled');
	}else{
		ipcRenderer.send('deleteUnlockLoopback',name)
		$("input[type='checkbox']").attr('disabled', 'disabled');
	}
}

// 搜索方法
function searchList() {
	let searchList = []
	// 创建两个正则表达式用于模糊搜索
	var ser1 =  new RegExp(searchName,'i');
	var ser2 =  new RegExp(searchPackageName,'i');
	// 循环列表将符合的结果存入新数组
	for (var i = 0; i < dataArr.length; i++) {
		if (ser1.test(dataArr[i].name) && ser2.test(dataArr[i].PackageFamilyName)) {
			searchList.push(dataArr[i])
		}
	}
	// 将数组渲染到页面上
	appendData(searchList)
	// 勾选已启用项目
	resetBtn(unlockLoopbackArr)
	// 指定已启用项目
	if (openTop) {
		$(".td-ellipsis").scrollTop(0)
		let tempNode = $("input[type='checkbox']:checked").parents(".data-list")
		$(".table .dataList").prepend(tempNode)
	}
}
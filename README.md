# Unlock-UWP-Proxy
快捷将UWP应用添加到[环回免除列表](https://docs.microsoft.com/en-us/windows/iot-core/develop-your-app/loopback)以使用代理加速访问
![](demo.gif)
## 所需环境
```
nodejs
```
## 使用方法
1.安装   
```
npm i
```
2.启动
```
npm run dev
```

## 请注意,本应用本身并不提供任何代理功能,需搭配代理软件使用
### 工作原理
使用[Get-AppxPackage](https://docs.microsoft.com/en-us/powershell/module/appx/get-appxpackage?view=win10-ps)命令获取到应用PackageFamilyName,   
之后将其添加[环回免除列表](https://docs.microsoft.com/en-us/windows/iot-core/develop-your-app/loopback)结束

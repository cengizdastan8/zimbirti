$ErrorActionPreference = "Stop"

function Resolve-Adb {
    $candidates = @(
        "adb",
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
        "$env:LOCALAPPDATA\Temp\tekpanel-android-sdk\platform-tools\adb.exe"
    )

    foreach ($candidate in $candidates) {
        try {
            return (Get-Command $candidate -ErrorAction Stop).Source
        } catch {
        }
    }

    throw "adb not found"
}

$adb = Resolve-Adb
$component = "com.tekpanel.app/com.tekpanel.app.TekPanelNotificationListener"

$devices = & $adb devices -l
$deviceLine = $devices | Where-Object { $_ -match "\sdevice\s" } | Select-Object -First 1
if (-not $deviceLine) {
    Write-Error "No authorized Android device found. Current adb output:`n$($devices -join [Environment]::NewLine)"
    exit 1
}

Write-Host "Device: $deviceLine"

& $adb shell cmd appops set com.tekpanel.app 10008 allow | Out-Null
& $adb shell cmd appops set com.tekpanel.app RUN_IN_BACKGROUND allow | Out-Null
& $adb shell cmd appops set com.tekpanel.app RUN_ANY_IN_BACKGROUND allow | Out-Null
& $adb shell cmd appops set com.tekpanel.app START_FOREGROUND allow | Out-Null
& $adb shell dumpsys deviceidle whitelist +com.tekpanel.app | Out-Null

& $adb shell cmd notification disallow_listener $component | Out-Null
Start-Sleep -Seconds 2
& $adb shell cmd notification allow_listener $component | Out-Null
Start-Sleep -Seconds 5

$enabled = & $adb shell settings get secure enabled_notification_listeners
$dump = & $adb shell dumpsys notification listeners
$isEnabled = $enabled -match [regex]::Escape($component)
$isLive = ($dump -join "`n") -match "ComponentInfo\{com\.tekpanel\.app/com\.tekpanel\.app\.TekPanelNotificationListener\} \(user 0\):"

Write-Host "Notification access: $(if ($isEnabled) { 'enabled' } else { 'disabled' })"
Write-Host "Listener live: $(if ($isLive) { 'yes' } else { 'no' })"
Write-Host ""
Write-Host "Relevant appops:"
& $adb shell cmd appops get com.tekpanel.app | Select-String -Pattern "10008|RUN_IN_BACKGROUND|RUN_ANY_IN_BACKGROUND|START_FOREGROUND|ACCESS_RESTRICTED_SETTINGS"

if (-not $isLive) {
    Write-Error "TekPanel listener is still not live. On MIUI, open Settings -> Apps -> TekPanel and enable Autostart / No battery restrictions manually."
    exit 1
}

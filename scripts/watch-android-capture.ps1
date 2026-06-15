param(
    [int]$Seconds = 120,
    [int]$IntervalSeconds = 2
)

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

function Get-XmlStringValue {
    param(
        [string]$XmlText,
        [string]$Name
    )

    $pattern = '<string name="' + [regex]::Escape($Name) + '">(?<value>.*?)</string>'
    $match = [regex]::Match($XmlText, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $match.Success) {
        return $null
    }

    return [System.Net.WebUtility]::HtmlDecode($match.Groups["value"].Value)
}

function Shorten {
    param(
        [string]$Text,
        [int]$Max = 90
    )

    $clean = ($Text -replace "\s+", " ").Trim()
    if ($clean.Length -le $Max) {
        return $clean
    }

    return $clean.Substring(0, $Max) + "..."
}

$adb = Resolve-Adb
$devices = & $adb devices -l
$deviceLine = $devices | Where-Object { $_ -match "\sdevice\s" } | Select-Object -First 1
if (-not $deviceLine) {
    Write-Error "No authorized Android device found. Current adb output:`n$($devices -join [Environment]::NewLine)"
    exit 1
}

$listener = & $adb shell settings get secure enabled_notification_listeners
$listenerEnabled = $listener -match "com\.tekpanel\.app/com\.tekpanel\.app\.TekPanelNotificationListener"

Write-Host "TekPanel Android capture watcher"
Write-Host "Device: $deviceLine"
Write-Host "Notification listener: $(if ($listenerEnabled) { 'enabled' } else { 'disabled' })"
Write-Host "Duration: $Seconds seconds"
Write-Host ""

$deadline = (Get-Date).AddSeconds($Seconds)
$lastDisplaySignature = ""
$lastQueueCount = -1

while ((Get-Date) -lt $deadline) {
    $xml = & $adb shell run-as com.tekpanel.app cat shared_prefs/tekpanel_capture_store.xml 2>$null
    $xmlText = ($xml -join "`n")

    if ([string]::IsNullOrWhiteSpace($xmlText)) {
        Write-Host "[$(Get-Date -Format HH:mm:ss)] capture store is empty"
        Start-Sleep -Seconds $IntervalSeconds
        continue
    }

    $messagesJson = Get-XmlStringValue -XmlText $xmlText -Name "messages"
    $diagnosticsJson = Get-XmlStringValue -XmlText $xmlText -Name "diagnostics"

    $messages = @()
    if (-not [string]::IsNullOrWhiteSpace($messagesJson)) {
        try {
            $parsedMessages = $messagesJson | ConvertFrom-Json
            if ($parsedMessages -is [array]) {
                $messages = $parsedMessages
            } elseif ($null -ne $parsedMessages) {
                $messages = @($parsedMessages)
            }
        } catch {
            $messages = @()
        }
    }

    $diagnostics = $null
    if (-not [string]::IsNullOrWhiteSpace($diagnosticsJson)) {
        try {
            $diagnostics = $diagnosticsJson | ConvertFrom-Json
        } catch {
            $diagnostics = $null
        }
    }

    $displaySignature = if ($null -eq $diagnostics) {
        "$messagesJson|none"
    } else {
        $acceptedId = ""
        if ($diagnostics.lastAcceptedMessage) {
            $acceptedId = [string]$diagnostics.lastAcceptedMessage.id
        }

        @(
            $messagesJson,
            $diagnostics.lastDecision,
            $diagnostics.lastRejectReason,
            $diagnostics.lastSeenPackage,
            $diagnostics.lastSeenTitle,
            $diagnostics.lastSeenText,
            $acceptedId
        ) -join "|"
    }

    if ($displaySignature -ne $lastDisplaySignature -or $messages.Count -ne $lastQueueCount) {
        $lastDisplaySignature = $displaySignature
        $lastQueueCount = $messages.Count

        $time = Get-Date -Format HH:mm:ss
        if ($null -eq $diagnostics) {
            Write-Host "[$time] queue=$($messages.Count) diagnostics=none"
        } else {
            $decision = Shorten -Text ([string]$diagnostics.lastDecision) -Max 30
            if ([string]$diagnostics.lastDecision -eq "accepted" -and $diagnostics.lastAcceptedMessage) {
                Write-Host "[$time] queue=$($messages.Count) decision=$decision"
                $accepted = $diagnostics.lastAcceptedMessage
                Write-Host "  accepted: $($accepted.sourceApp) / $(Shorten -Text ([string]$accepted.senderName) -Max 40) / $(Shorten -Text ([string]$accepted.messageText) -Max 100)"
            } else {
                $seenPackage = Shorten -Text ([string]$diagnostics.lastSeenPackage) -Max 50
                $reason = Shorten -Text ([string]$diagnostics.lastRejectReason) -Max 70
                Write-Host "[$time] queue=$($messages.Count) decision=$decision seen=$seenPackage reason=$reason"
            }
        }

        if ($messages.Count -gt 0) {
            $tail = $messages | Select-Object -Last 3
            foreach ($message in $tail) {
                Write-Host "  queued: $($message.captureMethod) $($message.sourceApp) / $(Shorten -Text ([string]$message.senderName) -Max 40) / $(Shorten -Text ([string]$message.messageText) -Max 100)"
            }
        }
    }

    Start-Sleep -Seconds $IntervalSeconds
}

$ErrorActionPreference = "Stop"

function Get-JavaMajorVersion($javaExe) {
  $oldErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $versionOutput = & $javaExe -version 2>&1 | Out-String
  $ErrorActionPreference = $oldErrorActionPreference
  if ($versionOutput -match 'version "(\d+)') {
    return [int]$Matches[1]
  }
  return $null
}

function Find-JavaHome {
  $candidates = @()

  if ($env:JAVA_HOME) {
    $candidates += $env:JAVA_HOME
  }

  $candidates += @(
    (Join-Path $env:TEMP "tekpanel-jdk21-full\jdk-21*"),
    (Join-Path $env:TEMP "tekpanel-jdk21\jdk-21*"),
    (Join-Path $env:TEMP "tekpanel-jdk21\jdk-21.0.11+10"),
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Java\jdk-21*",
    "C:\Program Files\Java\jdk-17*"
  )

  foreach ($candidate in $candidates) {
    foreach ($path in Resolve-Path $candidate -ErrorAction SilentlyContinue) {
      $javaExe = Join-Path $path "bin\java.exe"
      $keytoolExe = Join-Path $path "bin\keytool.exe"
      $awtDll = Join-Path $path "bin\awt.dll"
      if ((Test-Path $javaExe) -and (Test-Path $keytoolExe) -and (Test-Path $awtDll)) {
        $major = Get-JavaMajorVersion $javaExe
        if ($major -ge 17 -and $major -le 24) {
          return $path.Path
        }
      }
    }
  }

  $jdkRoot = Join-Path $env:TEMP "tekpanel-jdk21-full"
  $jdkHome = Join-Path $jdkRoot "jdk-21.0.11+10"
  $archive = Join-Path $env:TEMP "tekpanel-jdk21-full.zip"

  $javaExe = Join-Path $jdkHome "bin\java.exe"
  $keytoolExe = Join-Path $jdkHome "bin\keytool.exe"
  $awtDll = Join-Path $jdkHome "bin\awt.dll"

  if (-not ((Test-Path $javaExe) -and (Test-Path $keytoolExe) -and (Test-Path $awtDll))) {
    Remove-Item -LiteralPath $jdkRoot -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $jdkRoot | Out-Null
    Invoke-WebRequest -UseBasicParsing `
      -Uri "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse" `
      -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath $jdkRoot -Force
  }

  $downloadedHome = Get-ChildItem -LiteralPath $jdkRoot -Directory |
    Where-Object {
      (Test-Path (Join-Path $_.FullName "bin\java.exe")) -and
      (Test-Path (Join-Path $_.FullName "bin\keytool.exe")) -and
      (Test-Path (Join-Path $_.FullName "bin\awt.dll"))
    } |
    Select-Object -First 1

  if (-not $downloadedHome) {
    throw "Downloaded JDK is incomplete. java.exe, keytool.exe, or awt.dll is missing."
  }

  return $downloadedHome.FullName
}

function Ensure-AndroidSdk {
  $sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:TEMP "tekpanel-android-sdk" }
  $cmdlineToolsBin = Join-Path $sdkRoot "cmdline-tools\latest\bin"
  $sdkManager = Join-Path $cmdlineToolsBin "sdkmanager.bat"

  if (-not (Test-Path $sdkManager)) {
    $zip = Join-Path $env:TEMP "tekpanel-commandlinetools2.zip"
    $extract = Join-Path $env:TEMP "tekpanel-commandlinetools2"
    Remove-Item -LiteralPath $extract -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $extract | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $sdkRoot "cmdline-tools") | Out-Null
    Invoke-WebRequest -UseBasicParsing `
      -Uri "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" `
      -OutFile $zip
    Expand-Archive -LiteralPath $zip -DestinationPath $extract -Force
    Move-Item -LiteralPath (Join-Path $extract "cmdline-tools") -Destination (Join-Path $sdkRoot "cmdline-tools\latest") -Force
  }

  $env:ANDROID_HOME = $sdkRoot
  $env:ANDROID_SDK_ROOT = $sdkRoot

  $yes = "y`n" * 20
  $yes | & $sdkManager --sdk_root=$sdkRoot --licenses | Out-Host
  & $sdkManager --sdk_root=$sdkRoot "platform-tools" "platforms;android-36" "build-tools;36.0.0" | Out-Host

  return $sdkRoot
}

$javaHome = [string](Find-JavaHome | Select-Object -Last 1)
$sdkRoot = [string](Ensure-AndroidSdk | Select-Object -Last 1)

$env:JAVA_HOME = $javaHome
$env:PATH = (Join-Path $javaHome "bin") + ";" + (Join-Path $sdkRoot "platform-tools") + ";" + $env:PATH

Write-Output "Using JAVA_HOME=$javaHome"
Write-Output "Using ANDROID_HOME=$sdkRoot"

Push-Location android
try {
  .\gradlew.bat assembleDebug
} finally {
  Pop-Location
}

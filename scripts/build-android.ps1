$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $PSScriptRoot
$toolDirectory = Join-Path $projectDirectory '.android-tools'
$javaDirectory = Get-ChildItem (Join-Path $toolDirectory 'jdk') -Directory |
  Select-Object -First 1 -ExpandProperty FullName
$sdkDirectory = Join-Path $toolDirectory 'sdk'

if (-not $javaDirectory -or -not (Test-Path (Join-Path $sdkDirectory 'platforms\android-36'))) {
  throw 'Ferramentas Android locais ausentes. Consulte o README antes de compilar.'
}

$env:JAVA_HOME = $javaDirectory
$env:ANDROID_HOME = $sdkDirectory
$env:ANDROID_SDK_ROOT = $sdkDirectory

Push-Location $projectDirectory
try {
  npm run build
  npx cap sync android
  & (Join-Path $projectDirectory 'android\gradlew.bat') -p android assembleDebug
  if ($LASTEXITCODE -ne 0) { throw "Gradle terminou com código $LASTEXITCODE" }
  Write-Host 'APK gerado em android\app\build\outputs\apk\debug\app-debug.apk'
} finally {
  Pop-Location
}

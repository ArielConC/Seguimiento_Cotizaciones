# Ejecuta un respaldo de Neon hacia la carpeta local. Lo lanza el Programador de tareas.
param(
    [Parameter(Mandatory = $true)][string]$Destino,
    [int]$Mantener = 60,
    [double]$MinHoras = 0
)

$ErrorActionPreference = "Stop"
$base = $PSScriptRoot
$credFile = Join-Path $env:LOCALAPPDATA "CotizacionesBackup\neon.cred"
$python = Join-Path $base ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) { $python = "python" }

New-Item -ItemType Directory -Force -Path $Destino | Out-Null
$log = Join-Path $Destino "respaldo.log"

function Write-Log($text) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $text" | Add-Content -Path $log -Encoding UTF8
}

try {
    if (-not (Test-Path $credFile)) { throw "No existe la credencial. Ejecuta instalar_respaldo_automatico.ps1" }
    $secure = Get-Content $credFile | ConvertTo-SecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

    Push-Location $base
    $output = & $python backup_neon_local.py --destino $Destino --mantener $Mantener --min-horas $MinHoras 2>&1
    $code = $LASTEXITCODE
    Pop-Location

    $output | ForEach-Object { Write-Log "$_" }
    if ($code -ne 0) { throw "El respaldo termino con codigo $code" }
}
catch {
    Write-Log "FALLO: $($_.Exception.Message)"
    exit 1
}
finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
}
exit 0

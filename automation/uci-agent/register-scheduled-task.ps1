param(
  [string]$TaskName = "FUNDETER-UCI-Agent",
  [int]$IntervalHours = 6,
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
)

if ($IntervalHours -lt 1) {
  throw "IntervalHours debe ser >= 1."
}

$npmCmd = "C:\Program Files\nodejs\npm.cmd"
if (-not (Test-Path $npmCmd)) {
  throw "No se encontro npm.cmd en '$npmCmd'."
}

$escapedRoot = $ProjectRoot.Replace("'", "''")
$agentCommand = "Set-Location '$escapedRoot'; & '$npmCmd' run uci-agent:once"

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -Command `$ErrorActionPreference='Stop'; $agentCommand"

$trigger = New-ScheduledTaskTrigger -Daily -At 00:00
$trigger.RepetitionInterval = (New-TimeSpan -Hours $IntervalHours)
$trigger.RepetitionDuration = (New-TimeSpan -Days 3650)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Description "Ejecucion automatica del agente UCI-F de FUNDETER" `
  -Force | Out-Null

Write-Host "Tarea '$TaskName' registrada correctamente. Intervalo: cada $IntervalHours hora(s)."

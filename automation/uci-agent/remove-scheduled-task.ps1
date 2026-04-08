param(
  [string]$TaskName = "FUNDETER-UCI-Agent"
)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "Tarea '$TaskName' eliminada."
} else {
  Write-Host "No existe la tarea '$TaskName'."
}

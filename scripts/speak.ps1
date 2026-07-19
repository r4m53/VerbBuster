param(
  [Parameter(Mandatory=$true)][string]$Text,
  [Parameter(Mandatory=$true)][string]$OutputPath
)
$voice = New-Object -ComObject SAPI.SpVoice
$voice.Rate = -1
$stream = New-Object -ComObject SAPI.SpFileStream
$stream.Open($OutputPath, 3, $false)
$voice.AudioOutputStream = $stream
[void]$voice.Speak($Text)
$stream.Close()


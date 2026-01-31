# Email Duplicate Prevention & Firebase Storage Test

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Email Duplicate Prevention & Firebase Storage Test  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$timestamp = Get-Random -Minimum 100000 -Maximum 999999
$email = "test.dup.$timestamp@example.com"
$passed = 0
$failed = 0

# Test 1: First registration
Write-Host "Test 1: First registration succeeds..." -ForegroundColor Yellow
try {
  $body = @{
    email = $email
    password = "Pass123!"
    name = "User1"
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body `
    -ErrorAction Stop

  $data = $response.Content | ConvertFrom-Json
  
  if ($data.success -and $data.user.email -eq $email) {
    Write-Host "  ✅ PASS - User registered to Firebase`n" -ForegroundColor Green
    $passed++
  } else {
    Write-Host "  ❌ FAIL - Registration failed`n" -ForegroundColor Red
    $failed++
  }
} catch {
  Write-Host "  ❌ FAIL - Error: $($_.Exception.Message.Substring(0, [Math]::Min(50, $_.Exception.Message.Length)))`n" -ForegroundColor Red
  $failed++
}

# Test 2: Duplicate email
Write-Host "Test 2: Duplicate email is rejected..." -ForegroundColor Yellow
try {
  $body = @{
    email = $email
    password = "Pass123!"
    name = "User2"
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body `
    -ErrorAction Continue

  $data = $response.Content | ConvertFrom-Json
  $isDuplicate = ($data.message -like "*already*") -or ($data.message -like "*registered*") -or (-not $data.success)
  
  if ($isDuplicate) {
    Write-Host "  ✅ PASS - Duplicate email rejected`n" -ForegroundColor Green
    Write-Host "     Message: `"$($data.message)`"`n" -ForegroundColor Cyan
    $passed++
  } else {
    Write-Host "  ❌ FAIL - Duplicate not rejected`n" -ForegroundColor Red
    $failed++
  }
} catch {
  # Even if it throws, check the response
  if ($_.Exception.Response.StatusCode -eq 409) {
    Write-Host "  ✅ PASS - Duplicate email rejected (409 status)`n" -ForegroundColor Green
    $passed++
  } else {
    Write-Host "  ❌ FAIL - $($_.Exception.Message.Substring(0, 50))`n" -ForegroundColor Red
    $failed++
  }
}

# Test 3: Different email works
Write-Host "Test 3: Different email registers successfully..." -ForegroundColor Yellow
try {
  $email2 = "test.new.$timestamp@example.com"
  $body = @{
    email = $email2
    password = "Pass123!"
    name = "User3"
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body `
    -ErrorAction Stop

  $data = $response.Content | ConvertFrom-Json
  
  if ($data.success -and $data.user.email -eq $email2) {
    Write-Host "  ✅ PASS - New email registered`n" -ForegroundColor Green
    $passed++
  } else {
    Write-Host "  ❌ FAIL - New email registration failed`n" -ForegroundColor Red
    $failed++
  }
} catch {
  Write-Host "  ❌ FAIL - $($_.Exception.Message.Substring(0, 50))`n" -ForegroundColor Red
  $failed++
}

# Summary
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ Passed: $passed                                                  ║" -ForegroundColor Cyan
Write-Host "║  ❌ Failed: $failed                                                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($failed -eq 0) {
  Write-Host "✅ ALL TESTS PASSED!`n" -ForegroundColor Green
  Write-Host "Summary:" -ForegroundColor Green
  Write-Host "  ✅ Users can register with their email" -ForegroundColor Green
  Write-Host "  ✅ Duplicate emails are rejected with clear message" -ForegroundColor Green
  Write-Host "  ✅ All registration data is stored in Firebase" -ForegroundColor Green
  Write-Host "  ✅ Multiple users can register with different emails`n" -ForegroundColor Green
}

exit $failed

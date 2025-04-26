# Define the download URL and output file names
$downloadUrl = "https://github.com/mediar-ai/terminator/releases/latest/download/terminator-server-windows-x86_64.zip"
$zipFileName = "terminator-server-windows-x86_64.zip"
$destinationPath = ".\server_release" # Use double backslash for path

# Check if the destination directory already exists and remove it if it does
if (Test-Path $destinationPath) {
    Write-Host "Destination directory '$destinationPath' already exists. Removing it..."
    try {
        Remove-Item -Path $destinationPath -Recurse -Force -ErrorAction Stop
        Write-Host "Removed existing directory."
    } catch {
        Write-Error "Failed to remove existing directory '$destinationPath'. Error: $_"
        exit 1
    }
}

# Check if the zip file already exists and remove it if it does
if (Test-Path $zipFileName) {
    Write-Host "Existing zip file '$zipFileName' found. Removing it..."
    try {
        Remove-Item -Path $zipFileName -Force -ErrorAction Stop
        Write-Host "Removed existing zip file."
    } catch {
        Write-Error "Failed to remove existing zip file '$zipFileName'. Error: $_"
        # Decide if you want to exit or continue; continuing might be okay if download replaces it.
    }
}

# Download the file
Write-Host "Downloading $zipFileName from $downloadUrl..."
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFileName -ErrorAction Stop
    Write-Host "Download complete."
} catch {
    Write-Error "Failed to download the file. Error: $_"
    exit 1
}

# Expand the archive
Write-Host "Extracting $zipFileName to $destinationPath..."
try {
    Expand-Archive -Path $zipFileName -DestinationPath $destinationPath -Force -ErrorAction Stop
    Write-Host "Extraction complete."
} catch {
    Write-Error "Failed to extract the archive. Error: $_"
    # Attempt to clean up the downloaded zip file even if extraction fails
    if (Test-Path $zipFileName) {
        Write-Host "Attempting cleanup of downloaded zip file: $zipFileName..."
        Remove-Item -Path $zipFileName -Force
    }
    exit 1
}

# Clean up the downloaded zip file
Write-Host "Removing downloaded zip file: $zipFileName..."
try {
    Remove-Item -Path $zipFileName -Force -ErrorAction Stop
    Write-Host "Cleanup complete."
} catch {
    Write-Warning "Failed to remove the zip file '$zipFileName'. You may need to remove it manually. Error: $_"
    # Don't exit here, the main goal (extraction) was successful
}

Write-Host "Setup finished successfully. You can now run the server using: $destinationPath\server.exe --debug" 
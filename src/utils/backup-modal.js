import { downloadSave, copySaveToClipboard, loadSaveFromText, loadSaveFromFile } from './storage-functions.js';

/**
 * Initialize backup modal event listeners and return control functions
 * @param {string} storageKey - The localStorage key for the save data
 * @returns {object} Object containing backup modal control functions
 */
export function initBackupModal(storageKey) {
    const backupModal = document.getElementById('backup-modal');
    const btnBackup = document.getElementById('btn-backup');
    const backupDownloadBtn = document.getElementById('backup-download');
    const backupCopyBtn = document.getElementById('backup-continue');
    const restoreUploadBtn = document.getElementById('restore-upload');
    const restorePasteInput = document.getElementById('restore-paste');
    const restoreRestoreBtn = document.getElementById('restore-continue');

    // Hidden file input for upload
    let fileInput = document.getElementById('backup-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'backup-file-input';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }

    /**
     * Open the backup modal
     */
    function openBackupModal() {
        backupModal.classList.remove('hidden');
    }

    /**
     * Close the backup modal
     */
    function closeBackupModal() {
        backupModal.classList.add('hidden');
    }

    // Open backup modal
    btnBackup.addEventListener('click', openBackupModal);

    // Close backup modal when clicking outside
    backupModal.addEventListener('click', (e) => {
        if (e.target === backupModal) {
            closeBackupModal();
        }
    });

    // Download backup
    backupDownloadBtn.addEventListener('click', async () => {
        const success = downloadSave(storageKey, 'nethalastat_backup.json');
        if (success) {
            alert('✓ Backup downloaded successfully!');
        } else {
            alert('✗ Failed to download backup. Check console for details.');
        }
    });

    // Copy to clipboard
    backupCopyBtn.addEventListener('click', async () => {
        const success = await copySaveToClipboard(storageKey);
        if (success) {
            alert('✓ Backup copied to clipboard!');
        } else {
            alert('✗ Failed to copy backup. Check console for details.');
        }
    });

    // Upload backup file
    restoreUploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const success = await loadSaveFromFile(storageKey, file);
            if (success) {
                alert('✓ Backup restored successfully! Reloading...');
                // Reload the app to reflect the restored data
                location.reload();
            } else {
                alert('✗ Failed to restore backup. Invalid file format.');
            }
        }
        // Reset file input
        fileInput.value = '';
    });

    // Restore from pasted text
    restoreRestoreBtn.addEventListener('click', () => {
        const pastedText = restorePasteInput.value.trim();
        if (!pastedText) {
            alert('✗ Please paste a backup string first.');
            return;
        }
        
        const success = loadSaveFromText(storageKey, pastedText);
        if (success) {
            alert('✓ Backup restored successfully! Reloading...');
            // Reload the app to reflect the restored data
            location.reload();
        } else {
            alert('✗ Failed to restore backup. Invalid backup format.');
        }
    });

    // Return public API
    return {
        openBackupModal,
        closeBackupModal
    };
}

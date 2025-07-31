// Upload functionality
function initializeUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('csvFile');
    const selectedFile = document.getElementById('selectedFile');
    const fileName = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadForm = document.getElementById('uploadForm');
    const projectSelect = document.getElementById('projectId');

    // Check if both project and file are selected
    function checkFormReady() {
        const hasProject = projectSelect.value !== '';
        const hasFile = fileInput.files.length > 0;
        uploadBtn.disabled = !(hasProject && hasFile);
    }

    // Project selection change
    projectSelect.addEventListener('change', checkFormReady);

    // Drag and drop functionality
    uploadZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (isValidFileType(file)) {
                fileInput.files = files;
                showSelectedFile(file);
            } else {
                alert('Please select a CSV or Excel file (.csv, .xlsx, or .xls)');
            }
        }
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            showSelectedFile(e.target.files[0]);
        }
    });

    // Validate file type
    function isValidFileType(file) {
        const validTypes = [
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv');
    }

    // Show selected file
    function showSelectedFile(file) {
        fileName.textContent = file.name;
        selectedFile.style.display = 'block';
        checkFormReady();
    }

    // Clear file selection
    window.clearFile = function() {
        fileInput.value = '';
        selectedFile.style.display = 'none';
        checkFormReady();
    }

    // Form submission
    uploadForm.addEventListener('submit', function(e) {
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
        uploadBtn.disabled = true;
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUpload);

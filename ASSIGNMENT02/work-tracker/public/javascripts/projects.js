// Projects functionality
function initializeProjects() {
    // Color picker functionality for project forms
    const colorOptions = document.querySelectorAll('.color-option');
    const colorInput = document.getElementById('color');
    
    if (colorOptions.length > 0 && colorInput) {
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all options
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                this.classList.add('selected');
                
                // Update hidden input value
                colorInput.value = this.getAttribute('data-color');
            });
        });
    }

    // Handle delete modal for projects
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const projectId = button.getAttribute('data-project-id');
            const projectName = button.getAttribute('data-project-name');
            
            const modal = this;
            modal.querySelector('#projectName').textContent = projectName;
            modal.querySelector('#deleteForm').action = `/projects/delete/${projectId}`;
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProjects);
